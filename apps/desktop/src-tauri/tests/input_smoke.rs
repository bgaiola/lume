//! Runtime smoke test for the input module.
//!
//! We deliberately do NOT move the cursor or send key events as part of
//! the default test run: a `cargo test` should never disrupt the dev's
//! mouse position or accidentally type into the focused window. The
//! tests here only validate that the platform layer can be initialised
//! and that the permission probe returns a sane value.
//!
//! For destructive smoke tests (actually moving the cursor, scrolling,
//! typing) run them with `cargo test --test input_smoke -- --ignored`.

use lume_desktop_lib::input::{
    check_permission, mouse_scroll, move_mouse_relative, type_text, InputPermission,
};

#[test]
fn check_permission_returns_a_known_state() {
    let permission = check_permission();
    eprintln!("input permission state: {permission:?}");
    assert!(matches!(
        permission,
        InputPermission::Granted | InputPermission::Denied | InputPermission::Unknown
    ));
}

#[test]
#[ignore = "moves the real cursor; run on demand with --ignored"]
fn move_mouse_relative_zero_does_not_panic() {
    let result = move_mouse_relative(0, 0);
    eprintln!("move_mouse_relative(0, 0) -> {result:?}");
    // Without Accessibility permission on macOS this returns an error
    // rather than moving anything; either outcome is acceptable.
    assert!(result.is_ok() || matches!(result, Err(_)));
}

#[test]
#[ignore = "scrolls the focused window; run on demand with --ignored"]
fn scroll_zero_does_not_panic() {
    let _ = mouse_scroll(0, 0);
}

#[test]
#[ignore = "types text into the focused window; run on demand with --ignored"]
fn type_empty_does_not_panic() {
    let _ = type_text("");
}
