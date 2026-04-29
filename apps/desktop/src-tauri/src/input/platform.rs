//! Cross-platform input simulation backed by [`enigo`].
//!
//! `enigo` selects CGEvent on macOS, SendInput on Windows, and
//! X11 / Wayland on Linux. The public surface is OS-agnostic; the only
//! place we branch is in the permission probe ([`check_permission`]),
//! which on macOS calls `AXIsProcessTrusted` to detect a missing
//! Accessibility entitlement before the first silent no-op.

use enigo::{
    Axis, Button, Coordinate, Direction, Enigo, Key, Keyboard, Mouse, Settings,
};

use super::types::{
    ButtonAction, InputError, InputPermission, KeyAction, MouseButton,
};

fn make_enigo() -> Result<Enigo, InputError> {
    Enigo::new(&Settings::default()).map_err(|e| InputError::BackendInit(e.to_string()))
}

/// Move the mouse cursor to an absolute screen coordinate (in CSS-like
/// pixels, NOT scaled). Negative or off-screen values are silently
/// clamped by the OS.
pub fn move_mouse_absolute(x: i32, y: i32) -> Result<(), InputError> {
    let mut enigo = make_enigo()?;
    enigo
        .move_mouse(x, y, Coordinate::Abs)
        .map_err(|e| InputError::Backend(e.to_string()))
}

/// Move the cursor by a relative delta from its current position.
pub fn move_mouse_relative(dx: i32, dy: i32) -> Result<(), InputError> {
    let mut enigo = make_enigo()?;
    enigo
        .move_mouse(dx, dy, Coordinate::Rel)
        .map_err(|e| InputError::Backend(e.to_string()))
}

pub fn mouse_button(button: MouseButton, action: ButtonAction) -> Result<(), InputError> {
    let mut enigo = make_enigo()?;
    let direction = match action {
        ButtonAction::Press => Direction::Press,
        ButtonAction::Release => Direction::Release,
        ButtonAction::Click => Direction::Click,
    };
    let btn = match button {
        MouseButton::Left => Button::Left,
        MouseButton::Right => Button::Right,
        MouseButton::Middle => Button::Middle,
    };
    enigo
        .button(btn, direction)
        .map_err(|e| InputError::Backend(e.to_string()))
}

/// Scroll wheel deltas. Positive `dy` scrolls down, positive `dx`
/// scrolls right, matching the `WheelEvent` convention browsers emit.
pub fn mouse_scroll(dx: i32, dy: i32) -> Result<(), InputError> {
    let mut enigo = make_enigo()?;
    if dx != 0 {
        enigo
            .scroll(dx, Axis::Horizontal)
            .map_err(|e| InputError::Backend(e.to_string()))?;
    }
    if dy != 0 {
        enigo
            .scroll(dy, Axis::Vertical)
            .map_err(|e| InputError::Backend(e.to_string()))?;
    }
    Ok(())
}

/// Press, release or click a key by name. Names follow a small whitelist
/// matching the most common WebRTC control-channel payloads. Unknown
/// names return [`InputError::UnknownKey`] so the renderer can decide
/// whether to fall back to [`type_text`].
pub fn key(name: &str, action: KeyAction) -> Result<(), InputError> {
    let mut enigo = make_enigo()?;
    let key = parse_key(name).ok_or_else(|| InputError::UnknownKey(name.to_string()))?;
    let direction = match action {
        KeyAction::Press => Direction::Press,
        KeyAction::Release => Direction::Release,
        KeyAction::Click => Direction::Click,
    };
    enigo
        .key(key, direction)
        .map_err(|e| InputError::Backend(e.to_string()))
}

/// Type a UTF-8 string, character by character. The renderer should use
/// this for plain text inserts and stick to [`key`] for shortcuts.
pub fn type_text(text: &str) -> Result<(), InputError> {
    let mut enigo = make_enigo()?;
    enigo
        .text(text)
        .map_err(|e| InputError::Backend(e.to_string()))
}

/// Probe the platform's input permission state. macOS gates input
/// simulation behind the Accessibility entitlement; Windows and Linux
/// either do not gate it (per-user session) or surface the dialog
/// inside the underlying API on first call.
pub fn check_permission() -> InputPermission {
    #[cfg(target_os = "macos")]
    {
        return check_permission_macos();
    }
    #[cfg(not(target_os = "macos"))]
    {
        InputPermission::Granted
    }
}

#[cfg(target_os = "macos")]
fn check_permission_macos() -> InputPermission {
    // Query AXIsProcessTrustedWithOptions directly. The function is not
    // exposed by the safe core-graphics bindings, so we link the symbol
    // ourselves. Apple documents NULL options as "use defaults: do not
    // prompt", which is exactly the behaviour we want for a probe.
    extern "C" {
        fn AXIsProcessTrustedWithOptions(options: *const std::ffi::c_void) -> bool;
    }

    let trusted = unsafe { AXIsProcessTrustedWithOptions(std::ptr::null()) };
    if trusted {
        InputPermission::Granted
    } else {
        InputPermission::Denied
    }
}

fn parse_key(name: &str) -> Option<Key> {
    let normalized = name.to_lowercase();
    let key = match normalized.as_str() {
        // Modifiers
        "shift" | "shiftleft" => Key::LShift,
        "shiftright" => Key::RShift,
        "control" | "ctrl" | "controlleft" => Key::LControl,
        "controlright" => Key::RControl,
        "alt" | "option" | "altleft" => Key::Alt,
        "meta" | "command" | "cmd" | "super" | "win" | "metaleft" => Key::Meta,

        // Whitespace + control
        "enter" | "return" => Key::Return,
        "tab" => Key::Tab,
        "space" => Key::Space,
        "backspace" => Key::Backspace,
        "delete" => Key::Delete,
        "escape" | "esc" => Key::Escape,
        "capslock" => Key::CapsLock,

        // Arrows
        "arrowup" | "up" => Key::UpArrow,
        "arrowdown" | "down" => Key::DownArrow,
        "arrowleft" | "left" => Key::LeftArrow,
        "arrowright" | "right" => Key::RightArrow,

        // Navigation
        "home" => Key::Home,
        "end" => Key::End,
        "pageup" => Key::PageUp,
        "pagedown" => Key::PageDown,

        // Function keys
        "f1" => Key::F1,
        "f2" => Key::F2,
        "f3" => Key::F3,
        "f4" => Key::F4,
        "f5" => Key::F5,
        "f6" => Key::F6,
        "f7" => Key::F7,
        "f8" => Key::F8,
        "f9" => Key::F9,
        "f10" => Key::F10,
        "f11" => Key::F11,
        "f12" => Key::F12,

        // Single character (letters, digits, punctuation): if the input
        // is one Unicode code point we hand it to enigo as a Unicode
        // key. The OS handles layout translation.
        single if single.chars().count() == 1 => {
            return single.chars().next().map(Key::Unicode);
        }
        _ => return None,
    };
    Some(key)
}
