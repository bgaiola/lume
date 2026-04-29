//! Lume desktop entry point.
//!
//! Phase 2 Block 1 delivered the Tauri shell hosting apps/web. Block 2
//! added native screen capture. Block 3 added native mouse and keyboard
//! simulation. Block 4 adds window-level capture and the desktop bounds
//! helper for multi-monitor coordinate mapping. Packaging and
//! auto-update land in subsequent blocks (see
//! docs/architecture/02-phase-2-backlog.md).

pub mod capture;
pub mod input;

use std::path::PathBuf;

use tauri::Manager;

use capture::{
    capture_display_to_file as native_capture_display,
    capture_window_to_file as native_capture_window,
    check_permission as native_check_capture_permission,
    desktop_bounds as native_desktop_bounds, list_displays as native_list_displays,
    list_windows as native_list_windows, CaptureError, CapturePermission, CapturedFrame,
    DesktopBounds, DisplayInfo, WindowInfo,
};
use input::{
    check_permission as native_check_input_permission, key as native_key,
    mouse_button as native_mouse_button, mouse_scroll as native_mouse_scroll,
    move_mouse_absolute as native_move_mouse_absolute,
    move_mouse_relative as native_move_mouse_relative, type_text as native_type_text,
    ButtonAction, InputError, InputPermission, KeyAction, MouseButton,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            ping,
            list_displays,
            list_windows,
            capture_display,
            capture_window,
            desktop_bounds,
            check_capture_permission,
            input_move_mouse,
            input_mouse_button,
            input_mouse_scroll,
            input_key,
            input_type_text,
            check_input_permission,
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

/* --------------------------- Capture commands --------------------------- */

#[tauri::command]
fn list_displays() -> Result<Vec<DisplayInfo>, CaptureError> {
    native_list_displays()
}

#[tauri::command]
fn list_windows() -> Result<Vec<WindowInfo>, CaptureError> {
    native_list_windows()
}

#[tauri::command]
fn capture_display(
    app: tauri::AppHandle,
    display_id: u32,
) -> Result<CapturedFrame, CaptureError> {
    let captures_dir = captures_directory(&app)?;
    native_capture_display(display_id, captures_dir)
}

#[tauri::command]
fn capture_window(
    app: tauri::AppHandle,
    window_id: u32,
) -> Result<CapturedFrame, CaptureError> {
    let captures_dir = captures_directory(&app)?;
    native_capture_window(window_id, captures_dir)
}

#[tauri::command]
fn desktop_bounds() -> Result<DesktopBounds, CaptureError> {
    native_desktop_bounds()
}

#[tauri::command]
fn check_capture_permission() -> CapturePermission {
    native_check_capture_permission()
}

fn captures_directory(app: &tauri::AppHandle) -> Result<PathBuf, CaptureError> {
    let cache_dir = app
        .path()
        .app_cache_dir()
        .map_err(|e| CaptureError::Native(format!("app_cache_dir: {e}")))?;
    Ok(cache_dir.join("captures"))
}

/* ---------------------------- Input commands ---------------------------- */

#[tauri::command]
fn input_move_mouse(x: i32, y: i32, relative: Option<bool>) -> Result<(), InputError> {
    if relative.unwrap_or(false) {
        native_move_mouse_relative(x, y)
    } else {
        native_move_mouse_absolute(x, y)
    }
}

#[tauri::command]
fn input_mouse_button(button: MouseButton, action: ButtonAction) -> Result<(), InputError> {
    native_mouse_button(button, action)
}

#[tauri::command]
fn input_mouse_scroll(dx: i32, dy: i32) -> Result<(), InputError> {
    native_mouse_scroll(dx, dy)
}

#[tauri::command]
fn input_key(key: String, action: KeyAction) -> Result<(), InputError> {
    native_key(&key, action)
}

#[tauri::command]
fn input_type_text(text: String) -> Result<(), InputError> {
    native_type_text(&text)
}

#[tauri::command]
fn check_input_permission() -> InputPermission {
    native_check_input_permission()
}
