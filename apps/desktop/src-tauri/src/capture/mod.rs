//! Native screen capture for the Lume desktop technician panel.
//!
//! Public surface is intentionally OS-agnostic. The implementation lives
//! in [`platform`] and selects the right backend at compile time via the
//! [`xcap`] crate.

mod platform;
mod types;

pub use platform::{
    capture_display_to_file, capture_window_to_file, check_permission, desktop_bounds,
    list_displays, list_windows,
};
pub use types::{
    CaptureError, CapturePermission, CapturedFrame, DesktopBounds, DisplayInfo, WindowInfo,
};
