fn main() {
    // macOS: link the ApplicationServices framework so the
    // AXIsProcessTrustedWithOptions symbol used by the input
    // permission probe resolves at link time.
    #[cfg(target_os = "macos")]
    println!("cargo:rustc-link-lib=framework=ApplicationServices");

    tauri_build::build()
}
