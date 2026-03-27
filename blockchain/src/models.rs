use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Represents a land title in the Ugandan land registry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LandTitle {
    pub title_id: String,
    pub owner_name: String,
    pub national_id: String,
    pub district: String,
    pub county: String,
    pub sub_county: String,
    pub parish: String,
    pub village: String,
    pub plot_number: String,
    pub size_acres: f64,
    pub coordinates: Option<String>,
    pub registered_at: DateTime<Utc>,
    pub status: TitleStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TitleStatus {
    Active,
    Transferred,
    Disputed,
    Revoked,
}

/// Transaction types that can be recorded on the blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Transaction {
    Register {
        title: LandTitle,
    },
    Transfer {
        title_id: String,
        from_owner: String,
        from_national_id: String,
        to_owner: String,
        to_national_id: String,
        timestamp: DateTime<Utc>,
    },
}

/// Validation error type
#[derive(Debug)]
pub struct ValidationError(pub String);

impl std::fmt::Display for ValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for ValidationError {}

/// Request body for registering a new land title
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RegisterTitleRequest {
    pub owner_name: String,
    pub national_id: String,
    pub district: String,
    pub county: String,
    pub sub_county: String,
    pub parish: String,
    pub village: String,
    pub plot_number: String,
    pub size_acres: f64,
    pub coordinates: Option<String>,
}

impl RegisterTitleRequest {
    /// Validate the registration request fields
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.owner_name.trim().is_empty() {
            return Err(ValidationError("Owner name cannot be empty".into()));
        }
        if self.national_id.trim().is_empty() {
            return Err(ValidationError("National ID cannot be empty".into()));
        }
        if self.district.trim().is_empty() {
            return Err(ValidationError("District cannot be empty".into()));
        }
        if self.county.trim().is_empty() {
            return Err(ValidationError("County cannot be empty".into()));
        }
        if self.sub_county.trim().is_empty() {
            return Err(ValidationError("Sub-county cannot be empty".into()));
        }
        if self.parish.trim().is_empty() {
            return Err(ValidationError("Parish cannot be empty".into()));
        }
        if self.village.trim().is_empty() {
            return Err(ValidationError("Village cannot be empty".into()));
        }
        if self.plot_number.trim().is_empty() {
            return Err(ValidationError("Plot number cannot be empty".into()));
        }
        if self.size_acres <= 0.0 {
            return Err(ValidationError("Size in acres must be greater than 0".into()));
        }
        if self.size_acres > 100_000.0 {
            return Err(ValidationError("Size in acres exceeds maximum allowed (100,000)".into()));
        }
        Ok(())
    }
}

/// Request body for transferring a land title
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TransferTitleRequest {
    pub to_owner: String,
    pub to_national_id: String,
}

impl TransferTitleRequest {
    /// Validate the transfer request fields
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.to_owner.trim().is_empty() {
            return Err(ValidationError("New owner name cannot be empty".into()));
        }
        if self.to_national_id.trim().is_empty() {
            return Err(ValidationError("New owner national ID cannot be empty".into()));
        }
        Ok(())
    }
}

/// Search query parameters
#[derive(Debug, Deserialize)]
pub struct SearchQuery {
    pub query: Option<String>,
    pub district: Option<String>,
}

/// API response wrapper
#[derive(Debug, Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    pub message: String,
    pub data: Option<T>,
}

impl<T: Serialize> ApiResponse<T> {
    pub fn success(message: &str, data: T) -> Self {
        Self {
            success: true,
            message: message.to_string(),
            data: Some(data),
        }
    }

    pub fn error(message: &str) -> Self {
        Self {
            success: false,
            message: message.to_string(),
            data: None,
        }
    }
}

impl LandTitle {
    pub fn new(req: RegisterTitleRequest) -> Self {
        Self {
            title_id: format!("UG-{}", Uuid::new_v4().to_string()[..8].to_uppercase()),
            owner_name: req.owner_name.trim().to_string(),
            national_id: req.national_id.trim().to_string(),
            district: req.district.trim().to_string(),
            county: req.county.trim().to_string(),
            sub_county: req.sub_county.trim().to_string(),
            parish: req.parish.trim().to_string(),
            village: req.village.trim().to_string(),
            plot_number: req.plot_number.trim().to_string(),
            size_acres: req.size_acres,
            coordinates: req.coordinates.map(|c| c.trim().to_string()),
            registered_at: Utc::now(),
            status: TitleStatus::Active,
        }
    }
}
