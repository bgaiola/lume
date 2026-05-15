/**
 * Adaptive bitrate controller for a single video RTP sender.
 *
 * Drives `RTCRtpSender.setParameters({ encodings: [{ maxBitrate }] })` from
 * live `getStats()` samples. The control loop is intentionally simple:
 *
 *  - If recent packet loss is high OR round-trip time is high, scale down
 *    aggressively (factor 0.8) to clear congestion fast.
 *  - If conditions are clearly good for several samples in a row, scale up
 *    gradually (factor 1.15) to claim more bandwidth.
 *  - Otherwise stay put.
 *
 * Hysteresis: after any change we wait `hysteresisMs` before changing
 * again, so the loop does not oscillate around a noisy threshold.
 *
 * The controller does not touch the peer connection beyond reading stats
 * and setting parameters on the supplied sender. It is stop/start safe.
 */

export interface AdaptiveBitrateConfig {
  /** Hard floor for the screen-share track, in bps. */
  minBps: number;
  /** Hard ceiling for the screen-share track, in bps. */
  maxBps: number;
  /** Starting bitrate before any stats arrive, in bps. */
  initialBps: number;
  /** How often the controller samples `getStats()`, in ms. */
  sampleIntervalMs: number;
  /** Minimum elapsed time between two bitrate changes, in ms. */
  hysteresisMs: number;
  /** Multiplicative factor when scaling up (e.g. 1.15 = +15%). */
  scaleUpFactor: number;
  /** Multiplicative factor when scaling down (e.g. 0.8 = -20%). */
  scaleDownFactor: number;
  /** Fraction of lost packets above which we scale down (0..1). */
  lossHigh: number;
  /** Fraction of lost packets below which we count as a "good" sample. */
  lossLow: number;
  /** Round-trip time above which we scale down, in ms. */
  rttHighMs: number;
  /** Round-trip time below which we count as a "good" sample, in ms. */
  rttLowMs: number;
  /** Consecutive good samples required before scaling up. */
  goodSamplesForUpscale: number;
}

export const DEFAULT_ADAPTIVE_BITRATE: AdaptiveBitrateConfig = {
  minBps: 300_000,
  maxBps: 8_000_000,
  initialBps: 2_500_000,
  sampleIntervalMs: 2_000,
  hysteresisMs: 4_000,
  scaleUpFactor: 1.15,
  scaleDownFactor: 0.8,
  lossHigh: 0.05,
  lossLow: 0.01,
  rttHighMs: 300,
  rttLowMs: 150,
  goodSamplesForUpscale: 3,
};

export type BitrateChangeReason = 'initial' | 'scaled-up' | 'scaled-down';

export interface BitrateChangePayload {
  bps: number;
  reason: BitrateChangeReason;
  lossFraction: number | null;
  rttMs: number | null;
}

type Now = () => number;

interface RtcStatsLike {
  type?: string;
  kind?: string;
  ssrc?: number;
  bytesSent?: number;
  packetsSent?: number;
  packetsLost?: number;
  fractionLost?: number;
  localId?: string;
  remoteId?: string;
  nominated?: boolean;
  state?: string;
  currentRoundTripTime?: number;
  selected?: boolean;
}

export class AdaptiveBitrateController {
  private readonly config: AdaptiveBitrateConfig;
  private readonly onChange: (payload: BitrateChangePayload) => void;
  private readonly now: Now;

  private sender: RTCRtpSender | null = null;
  private peer: RTCPeerConnection | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private currentBps: number;
  private lastChangeAt = 0;
  private goodSamples = 0;
  private lastPacketsSent = 0;
  private lastPacketsLost = 0;

  constructor(
    config: Partial<AdaptiveBitrateConfig> | undefined,
    onChange: (payload: BitrateChangePayload) => void,
    now: Now = Date.now,
  ) {
    this.config = { ...DEFAULT_ADAPTIVE_BITRATE, ...(config ?? {}) };
    this.onChange = onChange;
    this.now = now;
    this.currentBps = this.clamp(this.config.initialBps);
  }

  /**
   * Wire the controller to a peer connection and its video sender, then
   * apply the initial bitrate and start the sampling loop.
   */
  start(peer: RTCPeerConnection, sender: RTCRtpSender): void {
    this.stop();
    this.peer = peer;
    this.sender = sender;
    void this.applyBitrate(this.currentBps);
    this.onChange({
      bps: this.currentBps,
      reason: 'initial',
      lossFraction: null,
      rttMs: null,
    });
    this.timer = setInterval(() => {
      void this.tick();
    }, this.config.sampleIntervalMs);
  }

  /** Stop the loop. Idempotent. The sender is left at its current bitrate. */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.peer = null;
    this.sender = null;
  }

  /** Current target bitrate in bps. */
  get bitrate(): number {
    return this.currentBps;
  }

  private async tick(): Promise<void> {
    if (!this.peer || !this.sender) {
      return;
    }
    let lossFraction: number | null = null;
    let rttMs: number | null = null;
    try {
      const report = await this.peer.getStats(this.sender.track ?? undefined);
      const sample = this.extractSample(report);
      lossFraction = sample.lossFraction;
      rttMs = sample.rttMs;
    } catch {
      return;
    }

    const timeSinceChange = this.now() - this.lastChangeAt;
    if (timeSinceChange < this.config.hysteresisMs) {
      return;
    }

    const lossBad = lossFraction !== null && lossFraction >= this.config.lossHigh;
    const rttBad = rttMs !== null && rttMs >= this.config.rttHighMs;

    if (lossBad || rttBad) {
      const next = this.clamp(this.currentBps * this.config.scaleDownFactor);
      if (next !== this.currentBps) {
        this.goodSamples = 0;
        void this.commitChange(next, 'scaled-down', lossFraction, rttMs);
      }
      return;
    }

    const lossGood = lossFraction === null || lossFraction < this.config.lossLow;
    const rttGood = rttMs === null || rttMs < this.config.rttLowMs;
    if (lossGood && rttGood) {
      this.goodSamples += 1;
      if (this.goodSamples >= this.config.goodSamplesForUpscale) {
        const next = this.clamp(this.currentBps * this.config.scaleUpFactor);
        if (next !== this.currentBps) {
          this.goodSamples = 0;
          void this.commitChange(next, 'scaled-up', lossFraction, rttMs);
        }
      }
      return;
    }

    // Neutral zone: do not change, do not credit a good sample either.
    this.goodSamples = 0;
  }

  private extractSample(report: RTCStatsReport): {
    lossFraction: number | null;
    rttMs: number | null;
  } {
    let lossFraction: number | null = null;
    let rttMs: number | null = null;
    let outbound: RtcStatsLike | null = null;
    let remoteInbound: RtcStatsLike | null = null;
    let selectedPair: RtcStatsLike | null = null;

    report.forEach((value: RtcStatsLike) => {
      if (value.type === 'outbound-rtp' && value.kind === 'video') {
        outbound = value;
      } else if (value.type === 'remote-inbound-rtp' && value.kind === 'video') {
        remoteInbound = value;
      } else if (
        value.type === 'candidate-pair' &&
        value.state === 'succeeded' &&
        (value.nominated === true || value.selected === true)
      ) {
        selectedPair = value;
      }
    });

    if (remoteInbound) {
      const rib = remoteInbound as RtcStatsLike;
      if (typeof rib.fractionLost === 'number') {
        // Spec says fractionLost is 0..1. Some browsers historically
        // emitted 0..255. Detect and normalize.
        lossFraction = rib.fractionLost > 1 ? rib.fractionLost / 255 : rib.fractionLost;
      } else if (outbound) {
        const ob = outbound as RtcStatsLike;
        const sent = ob.packetsSent ?? 0;
        const lost = rib.packetsLost ?? 0;
        const deltaSent = sent - this.lastPacketsSent;
        const deltaLost = lost - this.lastPacketsLost;
        if (deltaSent > 0) {
          lossFraction = Math.max(0, deltaLost) / (deltaSent + Math.max(0, deltaLost));
        }
        this.lastPacketsSent = sent;
        this.lastPacketsLost = lost;
      }
    }

    if (selectedPair) {
      const cp = selectedPair as RtcStatsLike;
      if (typeof cp.currentRoundTripTime === 'number') {
        rttMs = cp.currentRoundTripTime * 1000;
      }
    }

    return { lossFraction, rttMs };
  }

  private async commitChange(
    next: number,
    reason: BitrateChangeReason,
    lossFraction: number | null,
    rttMs: number | null,
  ): Promise<void> {
    const applied = await this.applyBitrate(next);
    if (!applied) {
      return;
    }
    this.currentBps = next;
    this.lastChangeAt = this.now();
    this.onChange({ bps: next, reason, lossFraction, rttMs });
  }

  private async applyBitrate(bps: number): Promise<boolean> {
    if (!this.sender) {
      return false;
    }
    const params = this.sender.getParameters();
    const encodings = params.encodings && params.encodings.length > 0
      ? params.encodings.map((enc) => ({ ...enc, maxBitrate: bps }))
      : [{ maxBitrate: bps }];
    params.encodings = encodings;
    try {
      await this.sender.setParameters(params);
      return true;
    } catch {
      // Browsers occasionally reject setParameters mid-negotiation.
      // Swallow: next tick will retry.
      return false;
    }
  }

  private clamp(bps: number): number {
    return Math.max(this.config.minBps, Math.min(this.config.maxBps, Math.round(bps)));
  }
}
