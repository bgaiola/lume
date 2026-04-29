//! Runtime smoke test for the capture module. Skipped on CI machines
//! that lack a display, but the macOS / Windows / Linux dev boxes that
//! actually package the desktop client should always pass it.

use lume_desktop_lib::capture::{check_permission, list_displays, CapturePermission};

#[test]
fn list_displays_returns_at_least_one() {
    let displays = list_displays().expect("list_displays should not error");
    assert!(!displays.is_empty(), "expected at least one display");
    eprintln!("Detected {} display(s):", displays.len());
    for display in &displays {
        eprintln!(
            "  - id={} {}x{} @ ({},{}) scale={} primary={} freq={}Hz name={:?}",
            display.id,
            display.width,
            display.height,
            display.x,
            display.y,
            display.scale_factor,
            display.is_primary,
            display.frequency,
            display.name,
        );
    }
}

#[test]
fn check_permission_returns_a_known_state() {
    let permission = check_permission();
    eprintln!("capture permission state: {permission:?}");
    assert!(matches!(
        permission,
        CapturePermission::Granted | CapturePermission::Denied | CapturePermission::Unknown
    ));
}
