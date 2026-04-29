# Multi-monitor and window-level capture (Phase 2 Block 4)

> Status: data primitives done and verified on macOS. The renderer side
> of the multi-monitor UX (picker, coordinate mapping, per-monitor
> stream selection) lands in the integration block that consumes Blocks
> 2-4 together.

## What this block delivers

- New types in `apps/desktop/src-tauri/src/capture/types.rs`:
  - `WindowInfo`: id, app_name, title, x/y/width/height, the display
    id the window currently sits on, plus `is_minimized` /
    `is_maximized` / `is_focused`.
  - `DesktopBounds`: union rectangle of every display in the virtual
    desktop. Carries `min_x`, `min_y`, `max_x`, `max_y`, `width`,
    `height` and `display_count`.
  - `CapturedFrame` extended with `window_id: Option<u32>`. The
    renderer now distinguishes a display capture from a window
    capture without an extra round trip.
- New platform functions in `capture/platform.rs`:
  - `list_windows() -> Vec<WindowInfo>`
  - `capture_window_to_file(window_id, output_dir) -> CapturedFrame`
  - `desktop_bounds() -> DesktopBounds`
  - Refactored `write_capture` helper shared by display and window
    captures, so both code paths produce identical metadata.
- Three new Tauri commands the renderer can `invoke`:
  - `list_windows`
  - `capture_window`
  - `desktop_bounds`
- `CaptureError` gains `WindowNotFound(u32)`, with the existing
  structured serialisation (`{ kind, message }`).

## Why these primitives

A real remote-support session is rarely a single full-screen share:

1. The customer wants to share **one app**, not their entire desktop.
   Lume needs a window picker driven by `list_windows`. xcap returns
   the OS-native window list (Quartz on macOS, EnumWindows on Windows,
   X11/Wayland on Linux), with bounds we can render as thumbnails.
2. The technician needs to drive input on a **specific monitor**. The
   incoming WebRTC stream arrives as a single track at the renderer;
   when the technician clicks at video pixel `(x, y)`, the panel needs
   to know
   - which display that video represents on the customer side,
   - the display's offset in the virtual desktop,
   - the global desktop bounds for clamping,
   so it can synthesise a global coordinate that the host's
   `input_move_mouse` consumes. `desktop_bounds` is the third piece;
   the per-display origin already comes from `list_displays`.

Phase 2 Block 4 ships the **data** for that translation. The renderer
maths and the per-monitor stream selection are integration work that
follows Block 4 once we wire the WebRTC streaming side of the desktop
client.

## Coordinate model

Every capture and input function in the desktop client uses the same
coordinate system: top-left origin, unscaled (CSS) pixels, on the
**virtual desktop** that spans every display. Negative coordinates are
legal and routine (a secondary monitor placed left of the primary on
macOS lives at `x = -1920`).

```
DesktopBounds.min_x ◀───────── width ─────────▶ DesktopBounds.max_x
        ┌────────────────────┬──────────────────┐
        │                    │                  │
        │  Display 2         │  Display 1       │
        │  (-1920, 0)        │  (primary)       │
        │  1920x1080         │  (0, 0)          │
        │                    │  1512x982        │
        │                    │                  │
        └────────────────────┴──────────────────┘

Window living on Display 1 at (200, 100), 800x600
=> WindowInfo { x: 200, y: 100, width: 800, height: 600,
                current_display_id: Some(1) }
```

Mapping `(video_x, video_y)` from a streamed display capture to a
global coordinate:

```
display = list_displays().find(|d| d.id == streamed_display_id)
global_x = display.x + (video_x / video_width) * display.width
global_y = display.y + (video_y / video_height) * display.height
```

`scale_factor` from `DisplayInfo` only matters when the renderer wants
to display pixels at native density; the input pipeline always passes
unscaled coordinates because that is what `move_mouse_absolute`
expects.

## Verification done in this block

- `cargo test --test capture_smoke -- --nocapture` passes 4/4 on Apple
  Silicon macOS 26.
  - `list_windows` returns the OS-exposed window list. On a sandboxed
    `cargo test` binary that does not have Screen Recording we only
    see system windows (the Menu Bar). On the bundled production app
    with the entitlement, the full window list is available.
  - `desktop_bounds` returns `(0,0) -> (1512,982)` covering the
    single Retina display, matching `list_displays`.
  - The new test asserts that `desktop_bounds` covers every display
    returned by `list_displays`, so future multi-monitor setups stay
    consistent.
- The Tauri shell still compiles cleanly (`pnpm desktop:build`
  cached, full monorepo turbo run is 24/24 green).
- Cross-platform parity is unchanged: xcap exposes `Window::all` and
  the `current_monitor` accessor on every supported OS. No new
  `#[cfg]` gates were added.

## What is not done yet

- Renderer multi-monitor picker UX. The data is there; the panel UI
  will land alongside the WebRTC streaming integration.
- Coordinate mapping helper inside the panel. The math above will
  ship as a small `mapVideoCoordinatesToDesktop` helper in the panel
  or in `packages/webrtc` when we wire the host-side input dispatch.
- Live window-bound updates. Today `list_windows` is a snapshot. The
  integration block adds a small polling layer or, on macOS, an
  observer via the Accessibility APIs.
- Audio capture per window. `xcap` does not expose audio at all; the
  audio path will need a separate crate (CoreAudio, WASAPI loopback,
  PipeWire monitor stream) and is parked for a later block.
