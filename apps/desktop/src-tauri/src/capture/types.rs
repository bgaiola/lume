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
    pub display_id: u32,
    pub width: u32,
    pub height: u32,
    /// Absolute path on disk. The renderer can render via `convertFileSrc`.
    pub path: String,
    /// Bytes written to disk. Useful for client-side sanity checks.
    pub size_bytes: u64,
    pub captured_at: String,
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
