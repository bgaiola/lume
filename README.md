# Lume

> Premium remote access for the AI era. Browser-first, privacy-first, multi-technician native.

Lume is a TypeScript monorepo orchestrated with Turborepo and pnpm workspaces. This repository is at **Phase 1, Foundations**: the goal is a working browser-to-browser remote screen-sharing session backed by a NestJS API, a Socket.io signaling service, and a shared WebRTC SDK.

Differentiators (full product, multi-phase): AI Copilot during the session, Whisper mode (ghost cursor), indexed and searchable recordings, install-free browser join, native multi-technician, privacy-first defaults, automation marketplace.

---

## Repository layout

```
apps/
  api/             NestJS 10 backend (auth, users, organizations, sessions)
  web/             React + Vite technician panel
  client-web/      React + Vite end-customer screen-share UI
packages/
  protocol/        Shared message contracts (Zod schemas + types)
  shared/          Shared utils, validators, common types
  ui/              Shared design system (shadcn/ui based)
  webrtc/          Browser WebRTC SDK (LumeHost / LumeClient)
services/
  signaling/       Socket.io signaling server (SDP/ICE relay, control events)
infrastructure/
  docker/          docker-compose (Postgres, Redis, MinIO, coturn)
  coturn/          coturn server config
docs/
  architecture/    Architectural decision records and overviews
  planning/        Strategy, mockups, original prompts (non-code)
```

---

## Prerequisites

- **Node.js** ≥ 20 (use `nvm use` to honor `.nvmrc`)
- **pnpm** ≥ 9 (`npm i -g pnpm` or via `corepack enable`)
- **Docker Desktop** (for Postgres, Redis, MinIO and coturn locally)
- A **Resend** account for transactional email (free tier is enough for development)

---

## Quickstart (under 5 minutes)

```bash
# 1. Install dependencies
pnpm install

# 2. Generate a local .env with random JWT + magic-link secrets
pnpm env:bootstrap

# 3. Start local infrastructure (Postgres, Redis, MinIO, coturn)
pnpm infra:up

# 4. Run database migrations and seed
pnpm db:migrate
pnpm db:seed

# 5. Start every app in parallel (Turbo orchestrates)
pnpm dev
```

For the full end-to-end smoke test (technician + customer in two
browsers), see [docs/smoke-test.md](docs/smoke-test.md).

When everything is running you should reach:

- Technician panel: <http://localhost:5173>
- End-customer client: <http://localhost:5174>
- API: <http://localhost:3000>
- Signaling (WebSocket): `ws://localhost:3001`
- MinIO console: <http://localhost:9001>

---

## Top-level scripts

| Command           | What it does                                |
| ----------------- | ------------------------------------------- |
| `pnpm dev`        | Run every app in dev mode through Turborepo |
| `pnpm build`      | Production build for every app and package  |
| `pnpm lint`       | Run ESLint across the monorepo              |
| `pnpm typecheck`  | TypeScript project-wide typecheck           |
| `pnpm test`       | Run unit tests for every package            |
| `pnpm format`     | Prettier write across the repo              |
| `pnpm db:migrate` | Apply Prisma migrations                     |
| `pnpm db:seed`    | Seed development data                       |
| `pnpm db:studio`  | Open Prisma Studio                          |
| `pnpm infra:up`   | Start the docker-compose stack              |
| `pnpm infra:down` | Stop the docker-compose stack               |
| `pnpm infra:logs` | Tail docker-compose logs                    |

---

## Conventions

- **Code and code comments**: English.
- **User-facing documentation**: Spanish, English, Portuguese (in that priority order).
- **No em-dashes / en-dashes** in user-facing text. Use commas, periods, parentheses, colons.
- **Conventional Commits** for every commit message.
- **TypeScript strict** everywhere. No `any`. Use `unknown` plus type narrowing.
- **Zod** for runtime validation on every system boundary.
- **Accessibility**: AAA contrast minimum, full keyboard navigation, aria-labels.
- **Performance**: initial frontend bundles below 200 kB gzipped.

---

## Phase plan

- **Phase 1 (current)**: monorepo, API, signaling, web panel, client-web, WebRTC SDK, browser-to-browser smoke test.
- **Phase 2**: Tauri 2 desktop client (native screen capture, input control, multi-monitor).
- **Phase 3**: AI Copilot, indexed recordings, Whisper mode.
- **Phase 4**: payments, self-hosted edition, automation marketplace.

See [`docs/architecture/01-overview.md`](docs/architecture/01-overview.md) for the architectural overview.

---

## Strategic context

The product strategy, UI mockups, and original implementation prompt live under [`docs/planning/`](docs/planning/). They are intentionally kept inside the repo as durable references, not as code.

---

## License

UNLICENSED. All rights reserved.
