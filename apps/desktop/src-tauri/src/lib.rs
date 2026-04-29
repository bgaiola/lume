//! Lume desktop entry point.
//!
//! Phase 2 Block 1 keeps the Rust side intentionally minimal: the shell
//! just hosts the existing apps/web React panel inside a native window.
//! Native screen capture, input control and multi-monitor land in
//! subsequent blocks (see docs/architecture/02-phase-2-backlog.md).

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .invoke_handler(tauri::generate_handler![ping])
        .run(tauri::generate_context!())
        .expect("error while running Lume desktop");
}

/// Smoke-test command. Exposed so the renderer can verify the IPC
/// bridge is wired up before we add real native commands in Block 2.
#[tauri::command]
fn ping(message: String) -> String {
    format!("pong from Rust: {message}")
}
