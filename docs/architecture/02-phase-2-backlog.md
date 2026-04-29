# Phase 2: backlog

What ships in Phase 1 and what is intentionally left for Phase 2 onwards.
This doc is the source of truth when prioritising the next sprint.

## What Phase 1 already delivers

- Turborepo + pnpm workspace, strict TypeScript, ESLint + Prettier shared.
- NestJS 10 API: magic-link + JWT auth, Users, Organizations, Sessions
  modules with `POST /v1/sessions`, `GET /v1/sessions`,
  `GET /v1/sessions/:code/info`, `POST /v1/sessions/:code/join`.
- Prisma schema (User, Organization, Session) plus migrations workflow.
- Standalone Socket.io signaling service that verifies API-issued JWTs
  and relays SDP, ICE and control events.
- React panel (apps/web) with TanStack Router, Zustand auth store,
  TanStack Query, dark theme with lime accent, session creation flow
  with code + QR + copy URL + live host view.
- React end-customer page (apps/client-web): single-route public app,
  privacy-first welcome, getDisplayMedia, sharing screen, end screen.
- @lume/webrtc browser SDK: LumeHost + LumeClient, typed event emitter,
  ICE restart on failure, multi-viewer ready data structures.
- docker-compose stack: Postgres 16, Redis 7, MinIO, coturn.
- Manual smoke test guide (docs/smoke-test.md) with happy path and edge
  cases. LAN latency target: under 200 ms, no codec tuning yet.

## Phase 2 must-haves

### Tauri 2 desktop client (apps/desktop)

- Reuse apps/web for the renderer when feasible.
- Native screen capture: ScreenCaptureKit on macOS, DirectX/DXGI on
  Windows, PipeWire on Linux. Each has its own quirks around multi-
  monitor, HDR and DRM-protected content.
- Native input control (mouse, keyboard) on the host side, gated by
  a Whisper-mode toggle that limits clicks to "suggested only" until
  the customer accepts.
- Multi-monitor protocol: per-monitor track vs single tiled track. Lean
  toward per-monitor with selectable layout to keep bitrate honest.
- Auto-update via Tauri updater. Code-signing pipeline for Windows
  (EV cert) and macOS (Developer ID + notarisation).
- Packaging: MSI, DMG, AppImage and DEB targets in CI.

### WebRTC robustness

- **Adaptive bitrate**: replace the fixed 4 Mbps cap with a control
  loop that reads `RTCRtpSender.getStats()` (bytesSent, packetsLost,
  roundTripTime) and scales `params.encodings[0].maxBitrate` between
  300 kbps and 8 Mbps. Hysteresis to avoid oscillation.
- **Codec preference**: prefer VP9 (better screen-share compression),
  fallback to H.264 for hardware decoders. Currently we let SDP defaults
  decide.
- **Reconnection**: today we call `restartIce()` on failure but the
  Socket.io reconnect can still drop the room membership. Add a host
  presence registry so a host that returns within 30 seconds rejoins
  the same room.
- **Multi-technician**: extend LumeHost to handle multiple host peers
  per session (shared room with role-based broadcast). Requires SFU
  decision (mediasoup vs LiveKit vs Janus, leaning mediasoup for cost).

### API and infrastructure

- Refresh tokens as HttpOnly cookies. Today the access token sits in
  localStorage; phase 2 adds a refresh cookie with rotation.
- Google + Microsoft OAuth flows (configured but not wired in Phase 1).
- Session ownership enforcement on the signaling side. Phase 1 trusts
  the access token + the sessionCode; phase 2 hits the API to verify
  the host actually owns the session before accepting the handshake.
- Rate limiting on `/v1/auth/magic-link` and `/v1/sessions/:code/info`.
- BullMQ + Redis: background jobs for transactional email retries,
  upcoming recording transcoding, session cleanup.
- Observability: pino → Loki, OpenTelemetry traces, a Grafana board for
  signaling room counts + p50/p99 negotiation time.
- Production TURN: swap coturn for Cloudflare Calls TURN, drive
  credentials per-session via short-lived TURN auth.

### Code-splitting and budget

- Phase 1 ships apps/web at ~155 KB gzipped initial bundle. Add
  `lazy()` per route to drop the critical-path bundle below 60 KB
  gzipped. Same for apps/client-web (already small; verify).

### Quality

- Vitest unit tests for: session-code generator (alphabet, regex,
  rejection sampling), Zod schemas (round-trip), TypedEmitter (snapshot
  semantics), magic-link service.
- Playwright E2E for the full happy path against a Docker compose stack.
- Postgres integration tests with `@databases/pg-test` or a dedicated
  test schema.
- CI: GitHub Actions running lint, typecheck, build, unit + E2E across
  the monorepo with Turbo cache hooked up to Vercel Remote Cache or
  Turbo Remote Cache.

## Phase 3 (AI Copilot, recordings, Whisper)

- CopilotModule in NestJS calling Claude via the Anthropic SDK. Pipeline:
  capture screenshots every N seconds, post to Claude Vision, stream
  structured suggestions back to the panel.
- Indexed recordings: store WebM in R2, transcribe and transcript-index
  with full-text search.
- Whisper mode: ghost cursor overlay on the customer side, "click
  suggested here" pulses, technician toggle in the panel.

## Phase 4 (payments, self-hosted, marketplace)

- Stripe billing for PRO / TEAM / ENTERPRISE plans.
- Self-hosted edition packaged as a single docker-compose with offline
  license keys signed with the Lume private key.
- Automation marketplace: signed bundles a technician can run inside a
  session, with a manifest schema that the API gates by org plan.

## Tech debt and known gotchas

- `apps/api` build emits to `dist/` correctly but Turbo logs a "no
  output files" warning because Nest CLI cleans + emits in a way Turbo
  caches inconsistently. Low priority, build itself is fine.
- The CJS-only emit fight with Vite was solved by tsup dual-emit. Keep
  this pattern when adding new shared packages.
- `apps/api/.eslintrc.cjs` disables `consistent-type-imports` because
  the rule auto-fixes injected services into `import type` and breaks
  DI. Document this if we ever migrate to Nest 11.
- `services/signaling` uses a deep import from `socket.io/dist/typed-events`
  for `DefaultEventsMap`. Watch out on socket.io upgrades.
- The host-side trust model (Phase 1) accepts an access token plus a
  session code in the handshake without verifying ownership. See
  "Session ownership enforcement" above for the Phase 2 fix.
