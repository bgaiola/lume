# Native input control (Phase 2 Block 3)

> Status: cross-platform input simulation primitives wired into the
> desktop client and exposed as Tauri commands. The integration that
> drives these from the panel via the WebRTC data channel ships in a
> later block.

## What this block delivers

- A new Rust module `apps/desktop/src-tauri/src/input/` with six
  public functions:
  - `move_mouse_absolute(x, y)`
  - `move_mouse_relative(dx, dy)`
  - `mouse_button(button, action)`
  - `mouse_scroll(dx, dy)`
  - `key(name, action)`
  - `type_text(text)`
  plus a `check_permission` probe.
- Six Tauri commands the renderer can `invoke`:
  `input_move_mouse`, `input_mouse_button`, `input_mouse_scroll`,
  `input_key`, `input_type_text`, `check_input_permission`.
- A small key whitelist that maps the most common WebRTC
  control-channel key names (modifiers, arrows, function keys,
  navigation, single Unicode characters) to enigo's `Key` enum.
- A safe-by-default smoke test
  (`tests/input_smoke.rs`): the runs that would actually disturb the
  dev's cursor or focused window are `#[ignore]`d and executed on
  demand via `cargo test -- --ignored`.

## Why enigo

| Concern | enigo today |
| --- | --- |
| Cross-platform API | Yes: macOS (CGEvent), Windows (SendInput), Linux X11 + Wayland |
| Mouse + keyboard primitives | Yes |
| Active maintenance | Yes, 0.5.x line is current |
| Permission handling | None built-in; we add macOS Accessibility probe ourselves |
| Latency | Low, direct OS calls |
| Wayland coverage | Limited but growing; production Linux support will need ydotool fallback in Block 5 |

For Phase 2 Block 3 (primitives + command surface), enigo is the right
call. If a future block needs raw HID injection, deeper modifier-state
tracking, or a uniform Wayland story, we can swap the `platform.rs`
implementation without touching the public surface.

## Tauri command surface

```rust
input_move_mouse(x: i32, y: i32, relative?: bool)  // absolute by default
input_mouse_button(button: "left" | "right" | "middle", action: "press" | "release" | "click")
input_mouse_scroll(dx: i32, dy: i32)               // dy>0 = down, dx>0 = right
input_key(key: string, action: "press" | "release" | "click")
input_type_text(text: string)
check_input_permission(): { status: "granted" | "denied" | "unknown" }
```

`InputError` is serialised to a structured `{ kind, message }` envelope
matching the convention from Block 2's `CaptureError`. The renderer can
branch on `kind` to decide whether to surface a TCC dialog hint
(`permissionDenied`) or a generic retry banner.

## macOS Accessibility (TCC)

macOS gates input simulation behind the Accessibility entitlement. The
first time `enigo::Enigo::new` posts a CGEvent, the OS silently
no-ops if the app has not been granted Accessibility. Worse, no error
flows back: enigo returns `Ok(())` and the cursor never moves.

Block 3 detects this proactively via `AXIsProcessTrustedWithOptions`
(linked from the system frameworks). We pass a NULL options dictionary
so the call does NOT pop the system prompt: it returns `true` if the
process has Accessibility, `false` otherwise. The renderer can then
deep-link the user to System Settings > Privacy & Security >
Accessibility before any input attempt.

For the bundled production app (Block 5) we additionally need:

- `NSAppleEventsUsageDescription` and an Accessibility usage string in
  `Info.plist`, in user-facing copy.
- A first-run wizard that walks the user through the Accessibility
  grant. macOS does not allow third-party apps to open that
  preference pane directly; we link to the bundle path with
  instructions.

## Windows and Linux notes

- **Windows**: SendInput works for the current desktop session without
  any permission prompt. UAC-elevated targets (an admin window
  running while the technician is not elevated) reject input from
  non-elevated apps. Block 5 packaging will set up a UAC manifest
  level and document the elevation story.
- **Linux X11**: enigo uses `XTest` extension. Works on every standard
  X11 setup. No permission prompt.
- **Linux Wayland**: heavily restricted. Enigo's Wayland backend works
  only on compositors that expose virtual input via the
  `zwp_virtual_keyboard` and `zwlr_virtual_pointer` protocols
  (Sway, Hyprland, partially KDE). On GNOME Wayland it is currently
  unusable. Block 5 ships a documented fallback to `ydotool` (or
  another root-permitted virtual input daemon) for the common GNOME
  case, behind an opt-in toggle.

## Verification done in this block

- `cargo check` and `cargo test --test input_smoke -- --nocapture`
  pass on macOS Apple Silicon. The permission probe returns
  `InputPermission::Denied` because the dev binary has not been
  granted Accessibility yet (expected: this is the same TCC dance the
  capture module went through and the same prod story when we
  package the app).
- The destructive smoke tests (actual cursor movement, scroll, type)
  exist as `#[ignore]`d cases and can be run on demand with
  `cargo test --test input_smoke -- --ignored`.
- Cross-platform structural parity is the same story as Block 2: the
  `enigo` crate has Windows + Linux backends, the only `#[cfg]` gate
  in our code is the macOS Accessibility probe. Real Windows + Linux
  runtime tests ship with Block 5.

## What is not done yet

- Wiring of WebRTC data-channel events to these commands. The
  technician panel will translate `MouseEvent` and `KeyboardEvent`
  payloads it receives from the host's renderer into Tauri invokes.
  That integration block lands after multi-monitor (Block 4) so the
  panel can also resolve which monitor the input is targeting.
- Modifier-state tracking. Today every command opens a fresh `Enigo`
  instance, which means held modifiers across separate `key` calls
  do not persist. The integration block introduces a small
  state-aware session that holds an `Enigo` between calls.
- Wayland fallback to `ydotool`. Listed under Block 5.
