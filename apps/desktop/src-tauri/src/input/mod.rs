//! Native mouse and keyboard simulation for the Lume desktop client.
//!
//! Phase 2 Block 3 adds the platform layer and the Tauri command
//! surface. Wiring the WebRTC data channel up to these commands so the
//! technician can drive a remote desktop is the integration block that
//! follows multi-monitor (Block 4).

mod platform;
mod types;

pub use platform::{
    check_permission, key, mouse_button, mouse_scroll, move_mouse_absolute,
    move_mouse_relative, type_text,
};
pub use types::{ButtonAction, InputError, InputPermission, KeyAction, MouseButton};
