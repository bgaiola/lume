import { type JoinSessionResponse } from '@lume/protocol';
import { LumeHost, type LumePeerState } from '@lume/webrtc';
import {
  Camera,
  ChevronsRight,
  Clock,
  Edit3,
  FileDown,
  Loader2,
  Maximize,
  MessageCircle,
  Mic,
  Minimize,
  MonitorSmartphone,
  MousePointer2,
  ScanSearch,
  X,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { env } from '@/lib/env';

interface LiveSessionViewProps {
  sessionCode: string;
  /**
   * Session-scoped credential from `POST /v1/sessions/:code/host-token`.
   * The account token is not accepted by the signaling service any more:
   * it proves who you are, not which session you may host.
   */
  hostToken: string;
  /** Optional metadata coming from the API (host name, organization). */
  hostName?: string;
  organizationName?: string | null;
  /** Optional client display name once the customer has joined. */
  clientName?: string | null;
  /**
   * ICE servers from the API. The host technically does not call
   * /sessions/:code/join (that endpoint is for customers), but the same
   * STUN/TURN config applies. Phase 2 introduces a host-specific
   * /sessions/:id/host bootstrap; for now we pass a sane default.
   */
  iceServers?: JoinSessionResponse['iceServers'];
}

const STATE_COPY: Record<LumePeerState, string> = {
  idle: 'Preparando',
  'signaling-connecting': 'Conectando',
  'awaiting-peer': 'Esperando al cliente',
  negotiating: 'Estableciendo conexión',
  connected: 'En vivo',
  reconnecting: 'Reconectando',
  closed: 'Sesión cerrada',
};

const DEFAULT_ICE_SERVERS: JoinSessionResponse['iceServers'] = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

interface ConnectionStats {
  rttMs: number | null;
  fps: number | null;
  width: number | null;
  height: number | null;
  /** 'p2p' | 'relay' | null. Null while the candidate pair is unknown. */
  transport: 'p2p' | 'relay' | null;
}

const EMPTY_STATS: ConnectionStats = {
  rttMs: null,
  fps: null,
  width: null,
  height: null,
  transport: null,
};

function formatElapsed(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function pickQualityLabel(stats: ConnectionStats): string {
  if (!stats.height) return '...';
  if (stats.height >= 2000) return '4K';
  if (stats.height >= 1400) return 'QHD';
  if (stats.height >= 1000) return 'Full HD';
  if (stats.height >= 700) return 'HD';
  return 'SD';
}

export function LiveSessionView({
  sessionCode,
  hostToken,
  hostName,
  organizationName,
  clientName,
  iceServers,
}: LiveSessionViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<LumeHost | null>(null);
  const [state, setState] = useState<LumePeerState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [stats, setStats] = useState<ConnectionStats>(EMPTY_STATS);

  useEffect(() => {
    const onFullscreenChange = (): void => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    if (!containerRef.current) {
      return;
    }
    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch {
      // Browser may block fullscreen if not triggered by a user gesture.
    }
  }, []);

  useEffect(() => {
    setErrorMessage(null);
    setState('idle');
    setConnectedAt(null);
    setStats(EMPTY_STATS);

    const host = new LumeHost({
      signalingUrl: env.signalingUrl,
      hostToken,
      sessionCode,
      iceServers: ((iceServers ?? DEFAULT_ICE_SERVERS) as RTCIceServer[]),
    });
    hostRef.current = host;

    host.on('stateChange', ({ state: peerState }) => {
      setState(peerState);
      if (peerState === 'connected') {
        setConnectedAt((prev) => prev ?? Date.now());
      }
    });
    host.on('stream', ({ stream }) => {
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        void video.play().catch(() => {
          // Autoplay can be blocked; the user can click the video to start.
        });
      }
    });
    host.on('error', ({ message }) => {
      setErrorMessage(message);
    });
    host.on('disconnect', ({ message }) => {
      setErrorMessage(message ?? null);
      setState('closed');
    });

    void host.connect();

    return () => {
      host.disconnect('user');
      hostRef.current = null;
    };
  }, [sessionCode, hostToken, iceServers]);

  const isConnected = state === 'connected';
  const showVideo = isConnected || state === 'reconnecting';

  // Tick once per second while connected, for the timer. Don't run when
  // disconnected to avoid pointless renders.
  useEffect(() => {
    if (!connectedAt) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [connectedAt]);

  // Poll RTCPeerConnection.getStats() every 1s while connected. Picks the
  // first peer (Phase 1 only ever has one customer per session).
  useEffect(() => {
    if (!isConnected) return;
    let cancelled = false;
    let lastFramesDecoded = 0;
    let lastTimestamp = 0;

    const tick = async (): Promise<void> => {
      const host = hostRef.current;
      if (!host) return;
      const pcs = Array.from(host.peerConnections.values());
      const pc = pcs[0];
      if (!pc) return;

      try {
        const report = await pc.getStats();
        let rttMs: number | null = null;
        let width: number | null = null;
        let height: number | null = null;
        let transport: ConnectionStats['transport'] = null;
        let framesDecoded = 0;
        let videoTimestamp = 0;
        let selectedPairId: string | null = null;
        const candidates = new Map<string, { type: string }>();

        report.forEach((stat) => {
          if (stat.type === 'transport' && typeof stat.selectedCandidatePairId === 'string') {
            selectedPairId = stat.selectedCandidatePairId;
          }
          if (stat.type === 'local-candidate' || stat.type === 'remote-candidate') {
            candidates.set(stat.id, { type: stat.candidateType ?? 'host' });
          }
          if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
            if (typeof stat.frameWidth === 'number') width = stat.frameWidth;
            if (typeof stat.frameHeight === 'number') height = stat.frameHeight;
            if (typeof stat.framesDecoded === 'number') framesDecoded = stat.framesDecoded;
            if (typeof stat.timestamp === 'number') videoTimestamp = stat.timestamp;
          }
        });

        report.forEach((stat) => {
          if (stat.type !== 'candidate-pair') return;
          const isSelected = stat.id === selectedPairId || stat.selected === true || stat.nominated === true;
          if (!isSelected) return;
          if (typeof stat.currentRoundTripTime === 'number') {
            rttMs = Math.round(stat.currentRoundTripTime * 1000);
          }
          const local = typeof stat.localCandidateId === 'string' ? candidates.get(stat.localCandidateId) : undefined;
          const remote = typeof stat.remoteCandidateId === 'string' ? candidates.get(stat.remoteCandidateId) : undefined;
          if (local?.type === 'relay' || remote?.type === 'relay') {
            transport = 'relay';
          } else if (local || remote) {
            transport = 'p2p';
          }
        });

        let fps: number | null = null;
        if (lastFramesDecoded && videoTimestamp > lastTimestamp) {
          const dtSec = (videoTimestamp - lastTimestamp) / 1000;
          if (dtSec > 0) {
            fps = Math.max(0, Math.round((framesDecoded - lastFramesDecoded) / dtSec));
          }
        }
        lastFramesDecoded = framesDecoded;
        lastTimestamp = videoTimestamp;

        if (!cancelled) {
          setStats({ rttMs, fps, width, height, transport });
        }
      } catch {
        // getStats can fail right after disconnect; ignore.
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [isConnected]);

  const handleStop = (): void => {
    hostRef.current?.disconnect('user');
  };

  const elapsedSeconds = connectedAt ? (now - connectedAt) / 1000 : 0;
  const elapsedLabel = formatElapsed(elapsedSeconds);
  const sessionLabel = useMemo(() => `lumeapp.es/${sessionCode.toLowerCase()}`, [sessionCode]);
  const frameTitle = useMemo(() => {
    const parts: string[] = [];
    parts.push(clientName ?? 'Cliente');
    if (hostName) parts.push(`con ${hostName}`);
    if (organizationName) parts.push(organizationName);
    return parts.join(' · ');
  }, [clientName, hostName, organizationName]);

  const resolutionLabel = stats.width && stats.height ? `${stats.width}×${stats.height}` : '...';
  const transportLabel = stats.transport === 'relay' ? 'Relay' : stats.transport === 'p2p' ? 'P2P' : '...';

  return (
    <div className="flex h-full flex-col gap-4">
      <Topbar
        state={state}
        sessionLabel={sessionLabel}
        elapsedLabel={elapsedLabel}
        isConnected={isConnected}
        connectedAt={connectedAt}
        onStop={handleStop}
        onToggleFullscreen={() => void toggleFullscreen()}
        isFullscreen={isFullscreen}
      />

      <StatsRow stats={stats} isConnected={isConnected} />

      <div
        ref={containerRef}
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-line bg-surface-base"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-line bg-surface-elev px-4 py-2.5">
          <div className="flex items-center gap-2.5 text-xs text-ink-secondary">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" aria-hidden />
              <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" aria-hidden />
            </div>
            <span className="truncate">{frameTitle}</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-ink-tertiary">
            <span>{resolutionLabel}</span>
            <span className="flex items-center gap-1 text-lime">
              <Zap className="h-2.5 w-2.5" aria-hidden />
              {stats.rttMs == null ? '...' : `${stats.rttMs}ms`}
            </span>
            <span>{transportLabel}</span>
          </div>
        </div>

        <div className="relative flex-1 bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onDoubleClick={() => void toggleFullscreen()}
            className={`h-full w-full bg-black object-contain ${showVideo ? 'opacity-100' : 'opacity-0'}`}
          />

          {!showVideo && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ink-secondary">
              {state === 'awaiting-peer' ? (
                <>
                  <div className="h-3 w-3 animate-pulse-soft rounded-full bg-lime shadow-[0_0_12px_#b9ff66]" aria-hidden />
                  <p className="font-medium text-ink-primary">Esperando al cliente...</p>
                  <p className="max-w-md text-center text-sm">
                    Comparte el código{' '}
                    <span className="font-mono font-semibold text-ink-primary">{sessionCode}</span>{' '}
                    con tu cliente. Cuando entre verás su pantalla aquí.
                  </p>
                </>
              ) : (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
                  <p className="text-sm">{STATE_COPY[state]}...</p>
                </>
              )}
            </div>
          )}

          {errorMessage && (
            <div
              role="alert"
              className="absolute bottom-4 left-1/2 max-w-md -translate-x-1/2 rounded-lg border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger"
            >
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      <Toolbar isConnected={isConnected} elapsedLabel={elapsedLabel} />
    </div>
  );
}

interface TopbarProps {
  state: LumePeerState;
  sessionLabel: string;
  elapsedLabel: string;
  isConnected: boolean;
  connectedAt: number | null;
  isFullscreen: boolean;
  onStop: () => void;
  onToggleFullscreen: () => void;
}

function Topbar({
  state,
  sessionLabel,
  elapsedLabel,
  isConnected,
  connectedAt,
  isFullscreen,
  onStop,
  onToggleFullscreen,
}: TopbarProps): JSX.Element {
  const liveText = STATE_COPY[state];
  const dotClass = isConnected
    ? 'h-2 w-2 rounded-full bg-lime shadow-[0_0_12px_#b9ff66] animate-pulse-soft'
    : 'h-2 w-2 rounded-full bg-ink-tertiary';
  const liveLabelClass = isConnected ? 'text-lime' : 'text-ink-tertiary';

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className={dotClass} aria-hidden />
        <span
          className={cn(
            'font-mono text-[11px] uppercase tracking-[0.15em]',
            liveLabelClass,
          )}
        >
          {liveText}
        </span>
        <span className="rounded-md border border-line bg-surface-elev px-2.5 py-1 font-mono text-xs text-ink-secondary">
          {sessionLabel}
        </span>
        {connectedAt && (
          <span className="font-mono text-xs text-ink-secondary tabular-nums">{elapsedLabel}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <ChromeButton onClick={onToggleFullscreen} title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}>
          {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
          {isFullscreen ? 'Salir' : 'Pantalla completa'}
        </ChromeButton>
        <ChromeButton onClick={onStop} variant="danger" title="Finalizar sesión">
          <X className="h-3.5 w-3.5" />
          Finalizar
        </ChromeButton>
      </div>
    </div>
  );
}

interface ChromeButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  title?: string;
  disabled?: boolean;
}

function ChromeButton({ children, onClick, variant = 'default', title, disabled }: ChromeButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors',
        variant === 'default' &&
          'border-line bg-surface-elev text-ink-secondary hover:border-line-bright hover:bg-surface-hover hover:text-ink-primary',
        variant === 'danger' &&
          'border-danger/30 bg-danger/10 text-danger hover:bg-danger/20',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-surface-elev hover:text-ink-secondary',
      )}
    >
      {children}
    </button>
  );
}

interface StatsRowProps {
  stats: ConnectionStats;
  isConnected: boolean;
}

function StatsRow({ stats, isConnected }: StatsRowProps): JSX.Element {
  const placeholder = '...';
  const latencyLabel = !isConnected || stats.rttMs == null ? placeholder : `${stats.rttMs}ms`;
  const fpsLabel = !isConnected || stats.fps == null ? placeholder : `${stats.fps}fps`;
  const qualityLabel = !isConnected ? placeholder : pickQualityLabel(stats);

  return (
    <div className="grid grid-cols-3 gap-2.5">
      <StatCard label="Latencia" value={latencyLabel} accent />
      <StatCard label="Fotogramas" value={fpsLabel} />
      <StatCard label="Calidad" value={qualityLabel} accent />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }): JSX.Element {
  return (
    <div className="rounded-xl border border-line bg-surface-base px-3.5 py-2.5">
      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-tertiary">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 font-display text-2xl italic leading-none tabular-nums',
          accent ? 'text-lime' : 'text-ink-primary',
        )}
      >
        {value}
      </div>
    </div>
  );
}

interface ToolbarProps {
  isConnected: boolean;
  elapsedLabel: string;
}

function Toolbar({ isConnected, elapsedLabel }: ToolbarProps): JSX.Element {
  return (
    <div className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-line bg-surface-base px-3 py-2.5">
      <ToolButton icon={MousePointer2} title="Control del ratón (próximamente)" />
      <ToolButton icon={ScanSearch} title="Modo Whisper (próximamente)" />
      <ToolButton icon={Edit3} title="Anotación (próximamente)" />
      <ToolButton icon={FileDown} title="Transferir archivos (próximamente)" />
      <ToolButton icon={MessageCircle} title="Chat (próximamente)" />
      <ToolDivider />
      <ToolButton icon={Mic} title="Micrófono (próximamente)" />
      <ToolButton icon={Camera} title="Cámara (próximamente)" />
      <ToolDivider />
      <ToolButton icon={Clock} title="Time travel (próximamente)" />
      <ToolButton icon={MonitorSmartphone} title="Multimonitor (próximamente)" />
      {isConnected && (
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 font-mono text-[11px] text-danger">
          <ChevronsRight className="h-2.5 w-2.5" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-danger animate-pulse-soft" aria-hidden />
          <span>REC, {elapsedLabel}</span>
        </div>
      )}
    </div>
  );
}

function ToolButton({
  icon: Icon,
  title,
  active,
}: {
  icon: typeof MousePointer2;
  title: string;
  active?: boolean;
}): JSX.Element {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
        active
          ? 'border-lime bg-lime text-surface-deep'
          : 'border-line bg-transparent text-ink-secondary hover:border-line-bright hover:bg-surface-hover hover:text-ink-primary',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-ink-secondary',
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

function ToolDivider(): JSX.Element {
  return <div className="mx-1 h-6 w-px bg-line" aria-hidden />;
}
