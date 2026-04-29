//! Runtime smoke test for the capture module. Skipped on CI machines
//! that lack a display, but the macOS / Windows / Linux dev boxes that
//! actually package the desktop client should always pass it.

use lume_desktop_lib::capture::{
    check_permission, desktop_bounds, list_displays, list_windows, CapturePermission,
};

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

#[test]
fn list_windows_returns_a_vec() {
    // Windows can legitimately be zero on a fresh CI agent that has no
    // user windows open. We assert the call succeeds and report what we
    // see for diagnostics.
    let windows = list_windows().expect("list_windows should not error");
    eprintln!("Detected {} window(s):", windows.len());
    for window in windows.iter().take(8) {
        eprintln!(
            "  - id={} app={:?} title={:?} {}x{} @ ({},{}) display={:?} min={} max={} focus={}",
            window.id,
            window.app_name,
            window.title,
            window.width,
            window.height,
            window.x,
            window.y,
            window.current_display_id,
            window.is_minimized,
            window.is_maximized,
            window.is_focused,
        );
    }
    if windows.len() > 8 {
        eprintln!("  ... and {} more", windows.len() - 8);
    }
}

#[test]
fn desktop_bounds_covers_every_display() {
    let bounds = desktop_bounds().expect("desktop_bounds should not error");
    let displays = list_displays().expect("list_displays should not error");
    eprintln!(
        "Desktop bounds: ({},{}) -> ({},{}) {}x{} ({} display(s))",
        bounds.min_x,
        bounds.min_y,
        bounds.max_x,
        bounds.max_y,
        bounds.width,
        bounds.height,
        bounds.display_count,
    );
    assert_eq!(bounds.display_count as usize, displays.len());
    for display in &displays {
        assert!(
            bounds.min_x <= display.x,
            "min_x {} should be <= display.x {}",
            bounds.min_x,
            display.x,
        );
        assert!(
            bounds.min_y <= display.y,
            "min_y {} should be <= display.y {}",
            bounds.min_y,
            display.y,
        );
        let display_right = display.x + display.width as i32;
        let display_bottom = display.y + display.height as i32;
        assert!(
            bounds.max_x >= display_right,
            "max_x {} should be >= display right {}",
            bounds.max_x,
            display_right,
        );
        assert!(
            bounds.max_y >= display_bottom,
            "max_y {} should be >= display bottom {}",
            bounds.max_y,
            display_bottom,
        );
    }
}
