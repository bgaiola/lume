use serde::{Deserialize, Serialize};

/// Information about a single physical or logical display reachable from
/// the host. The frontend uses this list to ask the user which screen to
/// share with the customer.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DisplayInfo {
    pub id: u32,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub scale_factor: f32,
    pub is_primary: bool,
    pub frequency: f32,
}

/// Result of a single-frame capture. Phase 2 Block 2 delivers stills only;
/// streaming captures land in a later block when we wire the frames into
/// the WebRTC pipeline.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CapturedFrame {
    /// `Some(id)` when the frame came from `capture_display`, `None` for
    /// `capture_window` (which is identified by `window_id` instead).
    pub display_id: Option<u32>,
    pub window_id: Option<u32>,
    pub width: u32,
    pub height: u32,
    /// Absolute path on disk. The renderer can render via `convertFileSrc`.
    pub path: String,
    /// Bytes written to disk. Useful for client-side sanity checks.
    pub size_bytes: u64,
    pub captured_at: String,
}

/// Information about a single user-visible window on the host. Returned
/// by `list_windows` so the renderer can render a picker that lets the
/// customer share a specific app rather than the entire screen.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowInfo {
    pub id: u32,
    /// Application or process name. May be empty on Linux Wayland when
    /// the compositor refuses to expose it.
    pub app_name: String,
    pub title: String,
    /// Logical position in the virtual desktop space (in unscaled px).
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    /// Monitor id this window currently sits on, when the OS exposes it.
    pub current_display_id: Option<u32>,
    pub is_minimized: bool,
    pub is_maximized: bool,
    pub is_focused: bool,
}

/// Bounding rectangle of the entire virtual desktop, i.e. the union of
/// every display's bounds. Coords are top-left origin in unscaled
/// pixels, matching what `move_mouse_absolute` consumes.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopBounds {
    pub min_x: i32,
    pub min_y: i32,
    pub max_x: i32,
    pub max_y: i32,
    /// Width of the bounding rect (`max_x - min_x`).
    pub width: u32,
    /// Height of the bounding rect (`max_y - min_y`).
    pub height: u32,
    pub display_count: u32,
}

/// Outcome of a permission probe. macOS gates Screen Recording behind
/// TCC; Windows + Linux do not require an explicit grant. We surface the
/// distinction so the renderer can branch the UX.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "status", rename_all = "kebab-case")]
pub enum CapturePermission {
    /// Permission has been granted (or no permission is required on this OS).
    Granted,
    /// Permission has not been granted and the user must opt in.
    Denied,
    /// Cannot determine the state without attempting a capture.
    Unknown,
}

#[derive(Debug, thiserror::Error)]
pub enum CaptureError {
    #[error("display {0} not found")]
    DisplayNotFound(u32),
    #[error("window {0} not found")]
    WindowNotFound(u32),
    #[error("screen recording permission denied")]
    PermissionDenied,
    #[error("native capture failed: {0}")]
    Native(String),
    #[error("I/O error: {0}")]
    Io(#[from] std::io::Error),
}

impl serde::Serialize for CaptureError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let kind = match self {
            CaptureError::DisplayNotFound(_) => "displayNotFound",
            CaptureError::WindowNotFound(_) => "windowNotFound",
            CaptureError::PermissionDenied => "permissionDenied",
            CaptureError::Native(_) => "native",
            CaptureError::Io(_) => "io",
        };
        let mut state = serializer.serialize_struct("CaptureError", 2)?;
        use serde::ser::SerializeStruct;
        state.serialize_field("kind", kind)?;
        state.serialize_field("message", &self.to_string())?;
        state.end()
    }
}
