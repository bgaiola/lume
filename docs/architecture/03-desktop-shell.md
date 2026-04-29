# Desktop shell (Phase 2 Block 1)

> Status: scaffolded, opens the panel inside a native window. Native screen
> capture, mouse / keyboard control and multi-monitor land in subsequent
> blocks.

## What this block delivers

- `apps/desktop`: a Tauri 2 wrapper that hosts `apps/web` (the React
  technician panel) inside a native macOS / Windows / Linux window.
- A minimal Rust entry point (`src-tauri/src/lib.rs`) that registers the
  log plugin and a placeholder `ping` command so future blocks can verify
  the IPC bridge before wiring real native commands.
- Tauri config that points at the apps/web Vite dev server during
  development and at the apps/web production build at packaging time.
- Placeholder icon set generated from a single SVG via `rsvg-convert` and
  `iconutil`. Production icons land alongside the brand work later.

## Why Tauri 2 over Electron

| Concern         | Tauri 2                                   | Electron                                  |
| --------------- | ----------------------------------------- | ----------------------------------------- |
| Bundle size     | 5-15 MB (uses system webview)              | 100-200 MB (ships Chromium)                |
| Memory          | 50-150 MB                                  | 300-500 MB                                 |
| Backend lang    | Rust, fits the native-capture story       | Node.js, separate from native bridges      |
| Auto-update     | Built-in updater                          | Squirrel.Mac / .Win, more glue             |
| Code-signing    | First-class on every target               | Mature too                                 |
| Risk            | macOS WebKit quirks, less battle-tested   | Heavy, slower, but no surprises            |

For Lume specifically, native capture (ScreenCaptureKit on macOS, DXGI on
Windows, PipeWire on Linux) wants to live in Rust crates anyway, so Tauri
puts the host language right next to the work.

## Layout

```
apps/desktop/
├── package.json          # @tauri-apps/cli + workspace dep on @lume/web
└── src-tauri/
    ├── Cargo.toml        # Rust deps: tauri 2, tauri-plugin-log, serde
    ├── build.rs          # Tauri build hook
    ├── tauri.conf.json   # window config + bundle targets + dev/prod URLs
    ├── capabilities/
    │   └── default.json  # IPC permissions (Phase 2 Block 1: minimal)
    ├── icons/            # 32, 128, 128@2x PNG, .icns, .ico (placeholders)
    └── src/
        ├── main.rs       # binary entry, calls into lib::run
        └── lib.rs        # Tauri Builder, registers plugins + commands
```

`tauri.conf.json` points at `apps/web` two ways:

- `build.devUrl = "http://localhost:5173"` (Vite dev server)
- `build.frontendDist = "../../web/dist"` (production build output)

The `beforeDevCommand` in the same file launches `pnpm --filter @lume/web dev`
so a single `pnpm desktop:dev` boots both the Vite dev server and the
Tauri shell.

## Dev workflow

```bash
# Boot the desktop shell. This starts apps/web's dev server and opens
# a native window pointing at it. Hot reload works for the React side.
pnpm desktop:dev

# Produce a release-grade .dmg / .app on macOS, .msi on Windows, etc.
pnpm desktop:build
```

The first `cargo build` is slow (3 to 5 minutes on a clean system, ~150
crates). Subsequent builds are incremental and finish in seconds.

## Capability scope (Phase 2 Block 1)

`capabilities/default.json` only grants `core:default` and `log:default`.
The renderer can call `invoke('ping', { message: '...' })` and receive a
string back, but it cannot read the filesystem, spawn processes, control
input devices, or capture the screen yet. Each subsequent block adds a
narrowly-scoped capability with its plugin (Block 2 adds capture, Block 3
adds input control, etc.).

## Known limitations

- **Icons are placeholders**, generated from a single 1024x1024 SVG. The
  brand work in Phase 3 replaces them.
- **No code-signing yet.** A `.app` built locally will be quarantined by
  Gatekeeper. Block 5 wires up the Apple Developer ID + notarisation
  pipeline.
- **No auto-update yet.** Block 6 adds the Tauri updater with signed
  release manifests.
- **No native capture yet.** The renderer still uses `getDisplayMedia` if
  it ever needs to capture from the desktop side, which is browser-grade
  and goes through the system permission dialog. The whole point of the
  desktop client is to replace that with native APIs in Block 2.

## Next blocks

See [`docs/architecture/02-phase-2-backlog.md`](02-phase-2-backlog.md) for
the full Phase 2 list. The immediate next step is Block 2: native screen
capture for the customer side, exposed as a Tauri command the renderer
calls instead of `getDisplayMedia`. macOS first via the
`screencapturekit` crate (requires entitlements + screen recording
permission), then Windows DXGI, then Linux PipeWire.
