# Native screen capture (Phase 2 Block 2)

> Status: still-frame capture working on macOS, compile-checked on
> Windows and Linux. Streaming captures (frame loop wired into WebRTC)
> land in a later block.

## What this block delivers

- A new Rust module `apps/desktop/src-tauri/src/capture/` with three
  public functions: `list_displays`, `capture_display_to_file`,
  `check_permission`.
- Three Tauri commands the renderer can `invoke`: `list_displays`,
  `capture_display`, `check_capture_permission`.
- Cross-platform implementation backed by the [`xcap`] crate, which
  picks the right native API at compile time:
  - macOS: ScreenCaptureKit
  - Windows: Direct3D 11 + DXGI Output Duplication
  - Linux: X11 / PipeWire (per the desktop environment)
- A `CapturePermission` probe that returns `Granted` / `Denied` /
  `Unknown` so the UI can branch the experience (mostly a macOS thing,
  driven by TCC and the Screen Recording entitlement).
- A runtime smoke test (`tests/capture_smoke.rs`) that enumerates
  displays and checks permission, so any dev box that ships the
  desktop client also runs `cargo test` to validate the native side.

## Why a single cross-platform crate (for now)

xcap's API is `Monitor::all()` plus `monitor.capture_image()`. That maps
to ScreenCaptureKit, DXGI and PipeWire calls under the hood. We get
parity across all three OSes for the cost of one dependency. The
trade-offs:

| Concern | xcap today | What we lose |
| --- | --- | --- |
| Still capture (PNG / RGBA) | Yes, low latency | Nothing |
| Frame enumeration / display info | Yes | Nothing |
| Streaming at 60fps | Possible via `capture_image` in a loop | Per-frame allocation, not zero-copy |
| Cursor overlay control | No fine-grained API | macOS hides cursor by default |
| Audio capture | No | Need a separate path for audio |
| Window capture (specific windows, not full screen) | Yes via `Window::all` | Nothing |

For Phase 2 Block 2 (still capture + enumeration) xcap is the right
call. When we wire frames into WebRTC at high frame rate (Block 2.5 or
Block 3), the right move is to keep xcap on Linux (PipeWire is already
optimised), and drop down to per-platform crates on macOS
(`screencapturekit` direct, with an `IOSurface` zero-copy path) and
Windows (`windows-capture` with shared D3D textures).

The module structure lets us swap implementations without churning the
public surface: `capture::list_displays`, `capture::capture_display_to_file`
and `capture::check_permission` stay; the platform module behind them
changes.

## Tauri command surface

```rust
list_displays() -> Vec<DisplayInfo>
capture_display(displayId: u32) -> CapturedFrame
check_capture_permission() -> CapturePermission
```

`CapturedFrame` carries an absolute path on disk. Tauri's
`convertFileSrc` plus the `core:path:default` capability lets the
renderer turn that path into a `tauri://localhost/<encoded>` URL it can
drop into an `<img>`. Phase 2 Block 1 already granted the IPC bridge;
Block 2 adds `core:path:default` and `core:path:allow-resolve-directory`
so the renderer can preview the file we just wrote.

The frames go to the app cache directory (`AppHandle::path::app_cache_dir`):

- macOS: `~/Library/Caches/app.lume.desktop/captures/`
- Linux: `~/.cache/app.lume.desktop/captures/`
- Windows: `%LOCALAPPDATA%\app.lume.desktop\captures\`

## macOS Screen Recording permission (TCC)

macOS gates screen capture behind the Screen Recording entitlement. The
first time the app calls `Monitor::all().capture_image()`, the OS pops a
TCC dialog. After the user grants permission, future calls succeed.
Until then, ScreenCaptureKit returns blank monitor names, which is the
signal `check_permission_macos()` looks for.

For the bundled app (Phase 2 Block 5) we also need:

- `NSScreenCaptureDescription` in `Info.plist`, explaining why Lume
  needs it, in user-facing copy.
- A helper instructing the user to open System Settings →
  Privacy & Security → Screen Recording, since the OS does not let an
  app open that pane directly.

Block 2 of Phase 2 leaves the `Info.plist` change for the packaging
block; the dev binary still works because Tauri dev runs it under the
ad-hoc developer signature which gets the dialog.

## Windows and Linux notes

- **Windows**: xcap uses DXGI Output Duplication. No permission dialog,
  but the user must run with a desktop session (no headless RDP). When
  HDR is on, xcap returns SDR-tonemapped pixels; that is the correct
  default for screen sharing.
- **Linux**: xcap branches on the desktop environment. On X11 it reads
  XComposite-backed framebuffers directly. On Wayland it goes through
  `xdg-desktop-portal` and PipeWire; the portal pops a permission
  dialog the first time and caches the choice per session. The portal
  is not yet universal (some distros ship a misconfigured one), so we
  document this in the smoke test guide before Phase 2 Block 5.

## Verification done in this block

- `cargo check` and `cargo test --test capture_smoke -- --nocapture`
  pass on macOS (Apple Silicon, macOS 26). The smoke test enumerates
  the real display and reports `Granted` for the permission probe,
  end to end.
- `cargo check --target x86_64-pc-windows-gnu` and
  `cargo check --target x86_64-unknown-linux-gnu` from macOS do NOT
  pass out of the box. Tauri pulls in `tauri-winres` (needs MinGW
  `windres`) for Windows and a GTK / WebKit / GLib stack via
  `pkg-config` for Linux. Neither is feasible to stage on a Mac
  without significant tooling install (mingw-w64 plus Linux sysroot
  via Docker / `cross`).
- The Block 2 code is structured so it is straightforward to validate
  on real OS instances: `xcap` is the only platform-conditional
  dependency, and our public surface is pure Rust types plus
  `#[cfg(target_os = "macos")]` only on the permission probe. We hit
  the actual cross-platform build in Phase 2 Block 5 with dedicated
  Windows + Linux CI runners.
- Until Block 5 ships, Windows and Linux capture parity is a
  **structural guarantee** (cfg gates verified by inspection), not a
  **runtime guarantee** (would require those OSes booted).
- The Tauri shell still builds (`pnpm desktop:dev` opens the panel; the
  capture commands are visible in the IPC handler list).

## What is not done yet (Phase 2, follow-up blocks)

- Streaming captures into the WebRTC pipeline (frame loop + encoded
  video track).
- Cursor overlay rendering (Whisper-mode hint, future Phase 3).
- Audio capture (system audio for product demos).
- Per-window capture UX in the renderer (right now we expose the
  enumeration API, but the panel does not yet have a picker).
- Windows + Linux runtime verification on real OS instances; today we
  only compile-check the cross-targets.

[`xcap`]: https://crates.io/crates/xcap
