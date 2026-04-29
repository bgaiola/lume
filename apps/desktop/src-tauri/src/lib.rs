//! Lume desktop entry point.
//!
//! Phase 2 Block 1 delivered the Tauri shell hosting apps/web. Block 2
//! adds the first native capability: cross-platform screen capture.
//! Native input control, multi-monitor layout, packaging and auto-update
//! land in subsequent blocks (see docs/architecture/02-phase-2-backlog.md).

pub mod capture;

use std::path::PathBuf;

use tauri::Manager;

use capture::{
    capture_display_to_file as native_capture, check_permission as native_check_permission,
    list_displays as native_list_displays, CaptureError, CapturePermission, CapturedFrame,
    DisplayInfo,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            ping,
            list_displays,
            capture_display,
            check_capture_permission,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Lume desktop");
}

/// Smoke-test command from Block 1. Kept around as a quick "is the IPC
/// bridge alive" probe for the renderer.
#[tauri::command]
fn ping(message: String) -> String {
    format!("pong from Rust: {message}")
}

/// Enumerate every display reachable from the host OS.
#[tauri::command]
fn list_displays() -> Result<Vec<DisplayInfo>, CaptureError> {
    native_list_displays()
}

/// Capture a single still frame and write it to the app cache directory.
/// Returns metadata so the renderer can render a preview via
/// `convertFileSrc`.
#[tauri::command]
fn capture_display(
    app: tauri::AppHandle,
    display_id: u32,
) -> Result<CapturedFrame, CaptureError> {
    let cache_dir: PathBuf = app
        .path()
        .app_cache_dir()
        .map_err(|e| CaptureError::Native(format!("app_cache_dir: {e}")))?;
    let captures_dir = cache_dir.join("captures");
    native_capture(display_id, captures_dir)
}

/// Probe the platform's screen-recording permission state.
#[tauri::command]
fn check_capture_permission() -> CapturePermission {
    native_check_permission()
}
