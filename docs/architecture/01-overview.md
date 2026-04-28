# Lume: Architectural overview (Phase 1)

> Status: **draft, evolves with each phase**
> Audience: contributors and reviewers
> Language: English (per project convention)

This document captures the high-level architecture and the major decisions made for Phase 1 (foundations). It is intentionally short. Each subsequent phase adds its own document beside this one (`02-…`, `03-…`).

---

## 1. Product context (one-paragraph version)

Lume is a browser-first remote access platform for professional technicians. A technician opens a session in the panel, the system mints a 5-character non-ambiguous code, and the end customer joins by typing the code in a public URL. Once both peers are connected through a Socket.io signaling layer they negotiate a WebRTC peer connection, the customer screen-shares (`getDisplayMedia`), and the technician sees the screen in real time. Phase 1 ends when this loop works end to end on a LAN under 200 ms latency.

---

## 2. Components

```
┌──────────────────────┐         ┌──────────────────────┐
│  apps/web            │         │  apps/client-web     │
│  (technician panel)  │         │  (end-customer UI)   │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                │
           │ HTTPS / WebSocket              │ HTTPS / WebSocket
           ▼                                ▼
┌──────────────────────┐         ┌──────────────────────┐
│  apps/api            │◀───────▶│  services/signaling  │
│  NestJS + Prisma     │  JWT    │  Socket.io           │
└──────────┬───────────┘         └──────────┬───────────┘
           │                                │
           ▼                                ▼
┌──────────────────────┐         ┌──────────────────────┐
│  PostgreSQL 16       │         │  WebRTC peer-to-peer │
│  Redis 7 (sessions,  │         │  (with TURN fallback │
│  cache, BullMQ)      │         │   via coturn / CF)   │
└──────────────────────┘         └──────────────────────┘
```

- **`apps/api`**: REST + auth + persistence. Mints session codes, issues short-lived JWTs that the signaling service trusts.
- **`services/signaling`**: Stateless Socket.io relay for SDP and ICE candidates plus control events. Stateless on purpose: any signaling instance can serve any session given a valid JWT, which makes horizontal scale trivial.
- **`apps/web`**: Technician panel. Authenticated via magic link + JWT. Hosts the WebRTC peer that consumes the customer stream.
- **`apps/client-web`**: Public end-customer page. No login. Validates the session code, requests `getDisplayMedia`, opens the WebRTC peer.
- **`packages/webrtc`**: Browser WebRTC wrapper exposing `LumeHost` and `LumeClient` classes with a typed event emitter, ICE failure handling, automatic reconnection and bitrate adaptation.
- **`packages/protocol`**: Single source of truth for every wire-level message (Zod schemas + inferred TypeScript types). Used by the API, the signaling service, and both frontends.
- **`packages/shared`**: Tiny utilities and shared validators (e.g. session code grammar).
- **`packages/ui`**: Design system on top of Radix and shadcn/ui, themed for the Lume look (lime accent on near-black background).

---

## 3. Key decisions and rationale

| #   | Decision                                                               | Why                                                                                                               |
| --- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | **Turborepo + pnpm workspaces**                                        | Zero-cost setup, fast incremental builds, native pnpm protocol resolves circular dependency risks early.          |
| 2   | **NestJS for the API**                                                 | Opinionated module system maps cleanly to multi-tenant SaaS, first-class DI, mature for long-lived services.      |
| 3   | **Prisma + PostgreSQL 16**                                             | Strong types from schema to client, painless migrations, Postgres scales far beyond Phase 1 needs.                |
| 4   | **Redis 7 for sessions / queues**                                      | Magic-link rate limiting, BullMQ for future background jobs (recordings, AI analysis), session presence.          |
| 5   | **Socket.io signaling**                                                | Robust transport fallback, room semantics out of the box, JWT-friendly handshake.                                 |
| 6   | **WebRTC native, no SFU yet**                                          | Phase 1 is 1:1. An SFU (mediasoup, LiveKit) joins in Phase 2 when multi-technician becomes a hard requirement.    |
| 7   | **Resend for email**                                                   | Modern API, react-email integration, low friction for magic links.                                                |
| 8   | **Cloudflare Calls TURN (planned), coturn local**                      | Anycast TURN with predictable per-GB pricing, no ops overhead. coturn covers self-hosted edition (Phase 4).       |
| 9   | **Hetzner compute, Cloudflare R2 storage**                             | 5-8x cheaper than AWS for our profile, R2 has zero egress fees which is decisive for video recordings (Phase 3).  |
| 10  | **5-character session code, alphabet ABCDEFGHJKMNPQRSTUVWXYZ23456789** | 32 unambiguous characters → 32⁵ ≈ 33.5M codes. Excludes 0/O, 1/I/L for readability over voice and screen capture. |

---

## 4. Multi-tenancy model

- **Org → Users → Sessions**, with `organizationId` denormalized on the `Session` row to allow simple per-tenant queries without joins.
- All queries that read `Session` MUST be scoped by the requester's `organizationId`. There is no cross-org access in Phase 1.

---

## 5. Auth flow (Phase 1)

1. User submits email on `/login`.
2. API issues a magic-link JWT (15 min TTL), Resend delivers a deep link to `/auth/callback?token=…`.
3. The frontend exchanges the magic link for a session pair: short-lived access JWT (15 min) + long-lived refresh token stored as an HttpOnly cookie.
4. The signaling service trusts the access JWT for the host; end customers receive a separate short-lived "join token" minted by the API in `POST /sessions/:code/join`.

OAuth (Google, Microsoft) follows the same pattern but skips the magic-link step. They are configured but optional in Phase 1.

---

## 6. Performance budgets

- Frontend bundles under 200 kB gzipped on first paint.
- API p50 latency under 50 ms on the hot path (session create / info / join).
- LAN smoke-test glass-to-glass latency under 200 ms (no codec optimization yet).

---

## 7. What is intentionally out of scope in Phase 1

- AI Copilot (Phase 3)
- Recordings (Phase 3)
- Payments (Phase 4)
- Tauri desktop client (Phase 2)
- Codec / bitrate tuning (post-functional)
- E2E test suite (only critical unit tests)

---

## 8. Open questions / follow-ups for Phase 2

- Which SFU? mediasoup vs LiveKit vs Janus.
- Native screen capture per OS (DirectX, ScreenCaptureKit, PipeWire).
- Tauri auto-update infrastructure and code-signing pipeline.
- Multi-monitor protocol (per-monitor track vs single tiled track).
- Production observability stack (Pino → Loki, OpenTelemetry traces, Grafana).
