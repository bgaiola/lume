use serde::{Deserialize, Serialize};

/// Mouse button identifiers exchanged with the renderer. Mirrors the
/// `enigo::Button` set we actually intend to support; we deliberately
/// omit the auxiliary back / forward buttons because they are not
/// reachable from the WebRTC `MouseEvent.button` enum the panel will
/// forward in the integration block.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum MouseButton {
    Left,
    Right,
    Middle,
}

/// Press / release / click semantics for a single button event.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ButtonAction {
    Press,
    Release,
    Click,
}

/// Press / release semantics for a key event. `Type` is reserved for
/// the higher-level `input_type_text` command.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum KeyAction {
    Press,
    Release,
    Click,
}

/// Input permission state. macOS gates input simulation behind the
/// Accessibility entitlement (TCC), so the renderer needs a probe to
/// branch the UX (show the System Settings link) before the first
/// failed input.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(tag = "status", rename_all = "kebab-case")]
pub enum InputPermission {
    /// Permission has been granted (or no permission is required on this OS).
    Granted,
    /// Permission has not been granted and the user must opt in.
    Denied,
    /// Cannot determine without attempting an input event.
    Unknown,
}

#[derive(Debug, thiserror::Error)]
pub enum InputError {
    #[error("input simulation backend failed to initialize: {0}")]
    BackendInit(String),
    #[error("input simulation failed: {0}")]
    Backend(String),
    #[error("accessibility permission denied")]
    PermissionDenied,
    #[error("unknown key identifier: {0}")]
    UnknownKey(String),
}

impl serde::Serialize for InputError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let kind = match self {
            InputError::BackendInit(_) => "backendInit",
            InputError::Backend(_) => "backend",
            InputError::PermissionDenied => "permissionDenied",
            InputError::UnknownKey(_) => "unknownKey",
        };
        let mut state = serializer.serialize_struct("InputError", 2)?;
        use serde::ser::SerializeStruct;
        state.serialize_field("kind", kind)?;
        state.serialize_field("message", &self.to_string())?;
        state.end()
    }
}
