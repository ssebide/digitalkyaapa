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
    pub ipfs_document_cid: Option<String>,
    pub registered_at: DateTime<Utc>,
    pub status: TitleStatus,
    pub zoning: ZoningType,
    pub active_leases: Vec<Lease>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ZoningType {
    Residential,
    Commercial,
    Agricultural,
    Industrial,
    MixedUse,
    Unzoned,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TitleStatus {
    Active,
    PendingTransfer,
    Transferred,
    Caveated,
    Disputed,
    Revoked,
}

/// Represents a caveat placed on a title
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Caveat {
    pub caveat_id: String,
    pub title_id: String,
    pub placed_by: String,
    pub reason: String,
    pub active: bool,
    pub placed_at: DateTime<Utc>,
}

/// Represents a lease on a title
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lease {
    pub lease_id: String,
    pub title_id: String,
    pub lessee_name: String,
    pub lessee_national_id: String,
    pub duration_months: u32,
    pub start_date: DateTime<Utc>,
    pub active: bool,
}

/// Transaction types that can be recorded on the blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Transaction {
    Register {
        title: LandTitle,
    },
    Transfer { // Maintaining legacy support or simple transfers
        title_id: String,
        from_owner: String,
        from_national_id: String,
        to_owner: String,
        to_national_id: String,
        timestamp: DateTime<Utc>,
    },
    InitiateTransfer {
        title_id: String,
        from_owner: String,
        from_national_id: String,
        to_owner: String,
        to_national_id: String,
        timestamp: DateTime<Utc>,
    },
    ApproveTransfer {
        title_id: String,
        new_owner: String,
        new_national_id: String,
        timestamp: DateTime<Utc>,
    },
    AddCaveat {
        caveat: Caveat,
    },
    RemoveCaveat {
        title_id: String,
        caveat_id: String,
        removed_at: DateTime<Utc>,
    },
    RegisterLease {
        lease: Lease,
    },
    TerminateLease {
        title_id: String,
        lease_id: String,
        terminated_at: DateTime<Utc>,
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
    pub ipfs_document_cid: Option<String>,
    pub zoning: ZoningType,
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

/// Request body for adding a caveat
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AddCaveatRequest {
    pub placed_by: String,
    pub reason: String,
}

impl AddCaveatRequest {
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.placed_by.trim().is_empty() {
            return Err(ValidationError("Caveat placer name cannot be empty".into()));
        }
        if self.reason.trim().is_empty() {
            return Err(ValidationError("Caveat reason cannot be empty".into()));
        }
        Ok(())
    }
}

/// Request body for registering a lease
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RegisterLeaseRequest {
    pub lessee_name: String,
    pub lessee_national_id: String,
    pub duration_months: u32,
}

impl RegisterLeaseRequest {
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.lessee_name.trim().is_empty() {
            return Err(ValidationError("Lessee name cannot be empty".into()));
        }
        if self.lessee_national_id.trim().is_empty() {
            return Err(ValidationError("Lessee national ID cannot be empty".into()));
        }
        if self.duration_months == 0 {
            return Err(ValidationError("Lease duration must be greater than 0".into()));
        }
        Ok(())
    }
}

/// Request body for approving a transfer
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ApproveTransferRequest {
    pub new_national_id: String,
}

impl ApproveTransferRequest {
    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.new_national_id.trim().is_empty() {
            return Err(ValidationError("National ID of the new owner must be provided for approval".into()));
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
            ipfs_document_cid: req.ipfs_document_cid.map(|c| c.trim().to_string()),
            registered_at: Utc::now(),
            status: TitleStatus::Active,
            zoning: req.zoning,
            active_leases: Vec::new(),
        }
    }
}
