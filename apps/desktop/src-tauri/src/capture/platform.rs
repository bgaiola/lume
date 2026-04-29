//! Cross-platform screen capture backed by the [`xcap`] crate.
//!
//! `xcap` picks the right native API at compile time:
//! - macOS: ScreenCaptureKit (via the Apple frameworks)
//! - Windows: Direct3D 11 + DXGI Output Duplication
//! - Linux: X11 / PipeWire (depending on the desktop environment)
//!
//! That gives us cross-platform parity with one set of code. If a future
//! requirement (cursor overlay, audio capture, very high frame rates)
//! outgrows what `xcap` exposes, the place to drop down to a
//! platform-specific crate is right here, behind `#[cfg(target_os = ...)]`.

use std::io::Cursor;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use image::{ImageBuffer, Rgba};
use xcap::Monitor;

use super::types::{CaptureError, CapturePermission, CapturedFrame, DisplayInfo};

/// Enumerate every display reachable by the OS.
pub fn list_displays() -> Result<Vec<DisplayInfo>, CaptureError> {
    let monitors = Monitor::all().map_err(|e| CaptureError::Native(e.to_string()))?;
    monitors
        .into_iter()
        .map(|m| {
            Ok(DisplayInfo {
                id: m.id().map_err(|e| CaptureError::Native(e.to_string()))?,
                name: m.name().map_err(|e| CaptureError::Native(e.to_string()))?,
                width: m.width().map_err(|e| CaptureError::Native(e.to_string()))?,
                height: m.height().map_err(|e| CaptureError::Native(e.to_string()))?,
                x: m.x().map_err(|e| CaptureError::Native(e.to_string()))?,
                y: m.y().map_err(|e| CaptureError::Native(e.to_string()))?,
                scale_factor: m
                    .scale_factor()
                    .map_err(|e| CaptureError::Native(e.to_string()))?,
                is_primary: m
                    .is_primary()
                    .map_err(|e| CaptureError::Native(e.to_string()))?,
                frequency: m
                    .frequency()
                    .map_err(|e| CaptureError::Native(e.to_string()))?,
            })
        })
        .collect()
}

/// Capture a single still frame from `display_id` and write it to
/// `output_dir` as PNG. Returns metadata about the capture so the
/// renderer can preview the file.
pub fn capture_display_to_file(
    display_id: u32,
    output_dir: PathBuf,
) -> Result<CapturedFrame, CaptureError> {
    let monitors = Monitor::all().map_err(|e| CaptureError::Native(e.to_string()))?;
    let monitor = monitors
        .into_iter()
        .find(|m| m.id().map(|id| id == display_id).unwrap_or(false))
        .ok_or(CaptureError::DisplayNotFound(display_id))?;

    let rgba = monitor
        .capture_image()
        .map_err(|e| CaptureError::Native(e.to_string()))?;

    let width = rgba.width();
    let height = rgba.height();
    let buffer: ImageBuffer<Rgba<u8>, _> =
        ImageBuffer::from_raw(width, height, rgba.into_raw())
            .ok_or_else(|| CaptureError::Native("frame buffer dimensions mismatch".into()))?;

    let mut bytes = Vec::with_capacity((width as usize) * (height as usize) * 4);
    buffer
        .write_to(&mut Cursor::new(&mut bytes), image::ImageFormat::Png)
        .map_err(|e| CaptureError::Native(e.to_string()))?;

    std::fs::create_dir_all(&output_dir)?;
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let filename = format!("lume-capture-{display_id}-{timestamp}.png");
    let path = output_dir.join(filename);
    std::fs::write(&path, &bytes)?;

    Ok(CapturedFrame {
        display_id,
        width,
        height,
        path: path.to_string_lossy().into_owned(),
        size_bytes: bytes.len() as u64,
        captured_at: chrono_now_iso(),
    })
}

/// Probe the screen-recording permission state. macOS gates capture
/// behind TCC; Windows and Linux either do not gate it at all (display
/// servers expose the framebuffer to any user-space app) or use portal
/// dialogs handled inside the underlying API on first call.
pub fn check_permission() -> CapturePermission {
    #[cfg(target_os = "macos")]
    {
        check_permission_macos()
    }
    #[cfg(not(target_os = "macos"))]
    {
        CapturePermission::Granted
    }
}

#[cfg(target_os = "macos")]
fn check_permission_macos() -> CapturePermission {
    // The cheapest probe: try to enumerate monitors and read their names.
    // When TCC has not granted Screen Recording, the names come back
    // blank or empty on macOS 14+. xcap surfaces this as a successful
    // call, so we fall back to: did at least one monitor return a
    // non-empty name?
    match Monitor::all() {
        Ok(monitors) if !monitors.is_empty() => {
            let any_named = monitors
                .iter()
                .any(|m| m.name().map(|name| !name.is_empty()).unwrap_or(false));
            if any_named {
                CapturePermission::Granted
            } else {
                CapturePermission::Denied
            }
        }
        Ok(_) => CapturePermission::Denied,
        Err(_) => CapturePermission::Unknown,
    }
}

fn chrono_now_iso() -> String {
    // Minimal ISO-8601 timestamp without pulling chrono. Good enough for
    // the renderer to display a wall-clock time alongside the frame.
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = now.as_secs();
    let nanos = now.subsec_nanos();
    let (y, mo, d, h, mi, s) = epoch_to_civil(secs);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        y,
        mo,
        d,
        h,
        mi,
        s,
        nanos / 1_000_000
    )
}

/// Howard Hinnant's days-from-civil algorithm, expanded inline so we do
/// not pull a date crate just for one timestamp. Returns (year, month,
/// day, hour, minute, second) in UTC.
fn epoch_to_civil(secs: u64) -> (i32, u32, u32, u32, u32, u32) {
    let days = (secs / 86_400) as i64;
    let time_of_day = (secs % 86_400) as u32;
    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u32;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe as i32 + era as i32 * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    (
        y,
        m,
        d,
        time_of_day / 3600,
        (time_of_day / 60) % 60,
        time_of_day % 60,
    )
}
