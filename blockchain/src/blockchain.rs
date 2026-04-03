use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

use crate::models::{
    AddCaveatRequest, ApproveTransferRequest, Caveat, LandTitle, TitleStatus,
    Transaction, TransferTitleRequest,
};

const DIFFICULTY: usize = 2;

/// A single block in the blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Block {
    pub index: u64,
    pub timestamp: String,
    pub transactions: Vec<Transaction>,
    pub previous_hash: String,
    pub hash: String,
    pub nonce: u64,
}

/// The blockchain itself
#[derive(Debug, Clone)]
pub struct Blockchain {
    pub db: sled::Db,
    pub chain: Vec<Block>,
    pub state: std::collections::HashMap<String, LandTitle>,
    pub caveats: std::collections::HashMap<String, Caveat>,
}

impl Block {
    /// Create a new block
    pub fn new(index: u64, transactions: Vec<Transaction>, previous_hash: String) -> Self {
        let mut block = Block {
            index,
            timestamp: Utc::now().to_rfc3339(),
            transactions,
            previous_hash,
            hash: String::new(),
            nonce: 0,
        };
        block.hash = block.mine_block();
        block
    }

    /// Calculate the hash of this block
    pub(crate) fn calculate_hash(&self) -> String {
        let data = format!(
            "{}{}{}{}{}",
            self.index,
            self.timestamp,
            serde_json::to_string(&self.transactions).unwrap_or_default(),
            self.previous_hash,
            self.nonce
        );
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    /// Mine the block with proof-of-work
    fn mine_block(&mut self) -> String {
        let target = "0".repeat(DIFFICULTY);
        loop {
            let hash = self.calculate_hash();
            if hash.starts_with(&target) {
                return hash;
            }
            self.nonce += 1;
        }
    }
}

impl Blockchain {
    /// Create a new in-memory blockchain for testing
    pub fn new() -> Self {
        let genesis_block = Block::new(0, vec![], String::from("0"));
        
        let config = sled::Config::new().temporary(true);
        let db = config.open().unwrap();
        
        let genesis_bytes = bincode::serialize(&genesis_block).unwrap();
        db.insert(b"block_0", genesis_bytes).unwrap();
        
        let length_bytes = bincode::serialize(&1u64).unwrap();
        db.insert(b"info_length", length_bytes).unwrap();
        db.flush().unwrap();
        
        Blockchain {
            db,
            chain: vec![genesis_block],
            state: std::collections::HashMap::new(),
            caveats: std::collections::HashMap::new(),
        }
    }

    /// Load blockchain from disk via sled or create new one
    pub fn load() -> Self {
        let db_path = "blockchain_db";
        let db = sled::open(db_path).unwrap_or_else(|_| panic!("Failed to open sled DB at {}", db_path));
        let mut chain = Vec::new();

        match db.get(b"info_length") {
            Ok(Some(length_bytes)) => {
                let length: u64 = bincode::deserialize(&length_bytes).unwrap_or(0);
                for i in 0..length {
                    let key = format!("block_{}", i);
                    if let Ok(Some(block_bytes)) = db.get(key.as_bytes()) {
                        if let Ok(block) = bincode::deserialize::<Block>(&block_bytes) {
                            chain.push(block);
                        } else {
                            eprintln!("⚠️ Failed to deserialize block {}", i);
                        }
                    } else {
                        eprintln!("⚠️ Missing block {} in database", i);
                    }
                }
                println!("✅ Loaded blockchain with {} blocks from sled DB", chain.len());
            }
            _ => {
                println!("🆕 Creating new blockchain with genesis block in sled");
                let genesis_block = Block::new(0, vec![], String::from("0"));
                chain.push(genesis_block.clone());
                
                let genesis_bytes = bincode::serialize(&genesis_block).unwrap();
                db.insert(b"block_0", genesis_bytes).unwrap();
                
                let length_bytes = bincode::serialize(&1u64).unwrap();
                db.insert(b"info_length", length_bytes).unwrap();
                db.flush().unwrap();
            }
        }

        let mut blockchain = Blockchain { 
            db, 
            chain, 
            state: std::collections::HashMap::new(),
            caveats: std::collections::HashMap::new(),
        };
        blockchain.rebuild_state();
        blockchain
    }

    /// Rebuilds the memory state trie dynamically from the chain history
    fn rebuild_state(&mut self) {
        self.state.clear();
        for block in &self.chain {
            for tx in &block.transactions {
                match tx {
                    Transaction::Register { title } => {
                        self.state.insert(title.title_id.clone(), title.clone());
                    }
                    Transaction::Transfer {
                        title_id,
                        to_owner,
                        to_national_id,
                        ..
                    } => {
                        if let Some(title) = self.state.get_mut(title_id) {
                            title.owner_name = to_owner.clone();
                            title.national_id = to_national_id.clone();
                            title.status = TitleStatus::Active;
                        }
                    }
                    Transaction::InitiateTransfer { title_id, .. } => {
                        if let Some(title) = self.state.get_mut(title_id) {
                            title.status = TitleStatus::PendingTransfer;
                        }
                    }
                    Transaction::ApproveTransfer {
                        title_id,
                        new_owner,
                        new_national_id,
                        ..
                    } => {
                        if let Some(title) = self.state.get_mut(title_id) {
                            title.owner_name = new_owner.clone();
                            title.national_id = new_national_id.clone();
                            title.status = TitleStatus::Active;
                        }
                    }
                    Transaction::AddCaveat { caveat } => {
                        self.caveats.insert(caveat.caveat_id.clone(), caveat.clone());
                        if let Some(title) = self.state.get_mut(&caveat.title_id) {
                            title.status = TitleStatus::Caveated;
                        }
                    }
                    Transaction::RemoveCaveat { title_id, caveat_id, .. } => {
                        if let Some(c) = self.caveats.get_mut(caveat_id) {
                            c.active = false;
                        }
                        // Simplistic removal (in a real system we'd check if there are other active caveats)
                        if let Some(title) = self.state.get_mut(title_id) {
                            title.status = TitleStatus::Active;
                        }
                    }
                }
            }
        }
    }

    /// Save the newest block to the database (Append-only storage)
    pub fn save_new_block(&self, block: &Block) {
        let key = format!("block_{}", block.index);
        match bincode::serialize(block) {
            Ok(block_bytes) => {
                if let Err(e) = self.db.insert(key.as_bytes(), block_bytes) {
                    eprintln!("⚠️ Failed to write block {} to sled DB: {}", block.index, e);
                }
                
                let new_length = block.index + 1;
                if let Ok(length_bytes) = bincode::serialize(&new_length) {
                    if let Err(e) = self.db.insert(b"info_length", length_bytes) {
                        eprintln!("⚠️ Failed to update chain length in sled: {}", e);
                    }
                }
                
                if let Err(e) = self.db.flush() {
                    eprintln!("⚠️ Failed to flush sled DB to disk: {}", e);
                }
            }
            Err(e) => {
                eprintln!("⚠️ Failed to serialize block: {}", e);
            }
        }
    }

    /// Get the latest block
    pub fn latest_block(&self) -> &Block {
        self.chain.last().expect("Chain must have at least one block")
    }

    /// Add a transaction and mine a new block
    pub fn add_transaction(&mut self, transaction: Transaction) -> Result<&Block, String> {
        // Prevent duplicate title registration
        if let Transaction::Register { title } = &transaction {
            if self.state.values().any(|t| {
                t.plot_number.to_lowercase() == title.plot_number.to_lowercase()
                    && t.district.to_lowercase() == title.district.to_lowercase()
            }) {
                return Err(format!(
                    "Title already registered for plot {} in {}",
                    title.plot_number, title.district
                ));
            }
        }

        let previous_hash = self.latest_block().hash.clone();
        let new_block = Block::new(
            self.chain.len() as u64,
            vec![transaction.clone()],
            previous_hash,
        );
        self.chain.push(new_block.clone());
        
        // Persist only the new block directly to DB
        self.save_new_block(&new_block);

        // Update state cache immediately for fast O(1) queries
        match transaction {
            Transaction::Register { title } => {
                self.state.insert(title.title_id.clone(), title);
            }
            Transaction::Transfer {
                title_id,
                to_owner,
                to_national_id,
                ..
            } => {
                if let Some(title) = self.state.get_mut(&title_id) {
                    title.owner_name = to_owner;
                    title.national_id = to_national_id;
                    title.status = TitleStatus::Active;
                }
            }
            Transaction::InitiateTransfer { title_id, .. } => {
                if let Some(title) = self.state.get_mut(&title_id) {
                    title.status = TitleStatus::PendingTransfer;
                }
            }
            Transaction::ApproveTransfer {
                title_id,
                new_owner,
                new_national_id,
                ..
            } => {
                if let Some(title) = self.state.get_mut(&title_id) {
                    title.owner_name = new_owner;
                    title.national_id = new_national_id;
                    title.status = TitleStatus::Active;
                }
            }
            Transaction::AddCaveat { caveat } => {
                let title_id = caveat.title_id.clone();
                self.caveats.insert(caveat.caveat_id.clone(), caveat);
                if let Some(title) = self.state.get_mut(&title_id) {
                    title.status = TitleStatus::Caveated;
                }
            }
            Transaction::RemoveCaveat { title_id, caveat_id, .. } => {
                if let Some(c) = self.caveats.get_mut(&caveat_id) {
                    c.active = false;
                }
                if let Some(title) = self.state.get_mut(&title_id) {
                    title.status = TitleStatus::Active;
                }
            }
        }

        Ok(self.chain.last().unwrap())
    }

    /// Validate the entire chain
    pub fn is_valid(&self) -> bool {
        if self.chain.is_empty() {
            return false;
        }

        // Validate genesis block
        let genesis = &self.chain[0];
        if genesis.index != 0 || genesis.previous_hash != "0" {
            return false;
        }
        if genesis.hash != genesis.calculate_hash() {
            return false;
        }
        let target = "0".repeat(DIFFICULTY);
        if !genesis.hash.starts_with(&target) {
            return false;
        }

        for i in 1..self.chain.len() {
            let current = &self.chain[i];
            let previous = &self.chain[i - 1];

            if current.index != previous.index + 1 {
                return false;
            }

            if current.previous_hash != previous.hash {
                return false;
            }

            if current.hash != current.calculate_hash() {
                return false;
            }

            if !current.hash.starts_with(&target) {
                return false;
            }
        }
        true
    }

    /// Get all registered land titles (current state)
    pub fn get_all_titles(&self) -> Vec<LandTitle> {
        self.state.values().cloned().collect()
    }

    /// Get a specific title by ID
    pub fn get_title(&self, title_id: &str) -> Option<LandTitle> {
        self.state.get(title_id).cloned()
    }

    /// Get the full history of a title
    pub fn get_title_history(&self, title_id: &str) -> Vec<(u64, String, Transaction)> {
        let mut history = vec![];
        for block in &self.chain {
            for tx in &block.transactions {
                let matches = match tx {
                    Transaction::Register { title } => title.title_id == title_id,
                    Transaction::Transfer { title_id: tid, .. } => tid == title_id,
                    Transaction::InitiateTransfer { title_id: tid, .. } => tid == title_id,
                    Transaction::ApproveTransfer { title_id: tid, .. } => tid == title_id,
                    Transaction::AddCaveat { caveat } => &caveat.title_id == title_id,
                    Transaction::RemoveCaveat { title_id: tid, .. } => tid == title_id,
                };
                if matches {
                    history.push((block.index, block.timestamp.clone(), tx.clone()));
                }
            }
        }
        history
    }

    /// Search titles by query
    pub fn search_titles(&self, query: &str, district: Option<&str>) -> Vec<LandTitle> {
        let query_lower = query.to_lowercase();
        self.state.values()
            .filter(|t| {
                let matches_query = t.owner_name.to_lowercase().contains(&query_lower)
                    || t.district.to_lowercase().contains(&query_lower)
                    || t.village.to_lowercase().contains(&query_lower)
                    || t.plot_number.to_lowercase().contains(&query_lower)
                    || t.title_id.to_lowercase().contains(&query_lower)
                    || t.national_id.to_lowercase().contains(&query_lower);

                let matches_district = district
                    .map(|d| t.district.to_lowercase() == d.to_lowercase())
                    .unwrap_or(true);

                matches_query && matches_district
            })
            .cloned()
            .collect()
    }

    /// Transfer a title to a new owner (Legacy method)
    pub fn transfer_title(
        &mut self,
        title_id: &str,
        req: &TransferTitleRequest,
    ) -> Result<&Block, String> {
        let title = self
            .get_title(title_id)
            .ok_or_else(|| format!("Title {} not found", title_id))?;

        if title.status == TitleStatus::Revoked || title.status == TitleStatus::Caveated {
            return Err("Cannot transfer a revoked or caveated title".to_string());
        }

        let transaction = Transaction::Transfer {
            title_id: title_id.to_string(),
            from_owner: title.owner_name.clone(),
            from_national_id: title.national_id.clone(),
            to_owner: req.to_owner.clone(),
            to_national_id: req.to_national_id.clone(),
            timestamp: Utc::now(),
        };

        self.add_transaction(transaction)
    }

    /// Step 1: Initiate a transfer (requires buyer approval)
    pub fn initiate_transfer(
        &mut self,
        title_id: &str,
        req: &TransferTitleRequest,
    ) -> Result<&Block, String> {
        let title = self
            .get_title(title_id)
            .ok_or_else(|| format!("Title {} not found", title_id))?;

        if title.status == TitleStatus::Revoked || title.status == TitleStatus::Caveated {
            return Err("Cannot transfer a revoked or caveated title".to_string());
        }
        if title.status == TitleStatus::PendingTransfer {
            return Err("Title already has a pending transfer".to_string());
        }

        let transaction = Transaction::InitiateTransfer {
            title_id: title_id.to_string(),
            from_owner: title.owner_name.clone(),
            from_national_id: title.national_id.clone(),
            to_owner: req.to_owner.clone(),
            to_national_id: req.to_national_id.clone(),
            timestamp: Utc::now(),
        };

        self.add_transaction(transaction)
    }

    /// Step 2: Approve the pending transfer
    pub fn approve_transfer(
        &mut self,
        title_id: &str,
        req: &ApproveTransferRequest,
    ) -> Result<&Block, String> {
        let title = self
            .get_title(title_id)
            .ok_or_else(|| format!("Title {} not found", title_id))?;

        if title.status != TitleStatus::PendingTransfer {
            return Err("Title does not have a pending transfer".to_string());
        }

        // We must trace the new owner from the InitiateTransfer tx in the history
        let mut intended_owner = String::new();
        let mut intended_national_id = String::new();
        
        // Very basic way to get the latest intended owner - find last InitiateTransfer for this title
        for block in self.chain.iter().rev() {
            for tx in block.transactions.iter().rev() {
                if let Transaction::InitiateTransfer { title_id: tid, to_owner, to_national_id, .. } = tx {
                    if tid == title_id {
                        intended_owner = to_owner.clone();
                        intended_national_id = to_national_id.clone();
                        break;
                    }
                }
            }
            if !intended_owner.is_empty() { break; }
        }

        if req.new_national_id != intended_national_id {
            return Err("Approval national ID does not match intended recipient".to_string());
        }

        let transaction = Transaction::ApproveTransfer {
            title_id: title_id.to_string(),
            new_owner: intended_owner,
            new_national_id: intended_national_id,
            timestamp: Utc::now(),
        };

        self.add_transaction(transaction)
    }

    /// Add a caveat
    pub fn add_caveat(
        &mut self,
        title_id: &str,
        req: &AddCaveatRequest,
    ) -> Result<&Block, String> {
        let title = self
            .get_title(title_id)
            .ok_or_else(|| format!("Title {} not found", title_id))?;

        if title.status == TitleStatus::Revoked {
            return Err("Cannot place a caveat on a revoked title".to_string());
        }

        let caveat = Caveat {
            caveat_id: format!("CAV-{}", uuid::Uuid::new_v4().to_string()[..8].to_uppercase()),
            title_id: title_id.to_string(),
            placed_by: req.placed_by.clone(),
            reason: req.reason.clone(),
            active: true,
            placed_at: Utc::now(),
        };

        self.add_transaction(Transaction::AddCaveat { caveat })
    }

    /// Remove a caveat
    pub fn remove_caveat(
        &mut self,
        title_id: &str,
        caveat_id: &str,
    ) -> Result<&Block, String> {
        let caveat = self.caveats.get(caveat_id)
            .ok_or_else(|| format!("Caveat {} not found", caveat_id))?;

        if caveat.title_id != title_id {
            return Err("Caveat does not belong to this title".to_string());
        }

        self.add_transaction(Transaction::RemoveCaveat {
            title_id: title_id.to_string(),
            caveat_id: caveat_id.to_string(),
            removed_at: Utc::now(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::RegisterTitleRequest;

    #[test]
    fn test_genesis_block() {
        let blockchain = Blockchain::new();
        assert_eq!(blockchain.chain.len(), 1);
        assert_eq!(blockchain.chain[0].index, 0);
        assert_eq!(blockchain.chain[0].previous_hash, "0");
    }

    #[test]
    fn test_add_title() {
        let mut blockchain = Blockchain::new();
        let title = LandTitle::new(RegisterTitleRequest {
            owner_name: "John Mukasa".to_string(),
            national_id: "CM1234567890".to_string(),
            district: "Wakiso".to_string(),
            county: "Busiro".to_string(),
            sub_county: "Nangabo".to_string(),
            parish: "Gayaza".to_string(),
            village: "Kayebe".to_string(),
            plot_number: "Block 123 Plot 45".to_string(),
            size_acres: 2.5,
            coordinates: Some("0.3476° N, 32.5825° E".to_string()),
            ipfs_document_cid: None,
        });

        let tx = Transaction::Register {
            title: title.clone(),
        };
        blockchain.add_transaction(tx).unwrap();

        assert_eq!(blockchain.chain.len(), 2);
        let titles = blockchain.get_all_titles();
        assert_eq!(titles.len(), 1);
        assert_eq!(titles[0].owner_name, "John Mukasa");
    }

    #[test]
    fn test_chain_validation() {
        let mut blockchain = Blockchain::new();
        let title = LandTitle::new(RegisterTitleRequest {
            owner_name: "Jane Nambi".to_string(),
            national_id: "CF9876543210".to_string(),
            district: "Kampala".to_string(),
            county: "Kampala".to_string(),
            sub_county: "Nakawa".to_string(),
            parish: "Naguru".to_string(),
            village: "Naguru II".to_string(),
            plot_number: "Block 5 Plot 12".to_string(),
            size_acres: 0.5,
            coordinates: None,
            ipfs_document_cid: None,
        });

        blockchain.add_transaction(Transaction::Register { title }).unwrap();
        assert!(blockchain.is_valid());
    }

    #[test]
    fn test_duplicate_title_rejected() {
        let mut blockchain = Blockchain::new();
        let title1 = LandTitle::new(RegisterTitleRequest {
            owner_name: "Alice".to_string(),
            national_id: "ID1".to_string(),
            district: "Kampala".to_string(),
            county: "C".to_string(),
            sub_county: "S".to_string(),
            parish: "P".to_string(),
            village: "V".to_string(),
            plot_number: "Plot 1".to_string(),
            size_acres: 1.0,
            coordinates: None,
            ipfs_document_cid: None,
        });
        
        let title2 = LandTitle::new(RegisterTitleRequest {
            owner_name: "Bob".to_string(),
            national_id: "ID2".to_string(),
            district: "Kampala".to_string(),
            county: "C".to_string(),
            sub_county: "S".to_string(),
            parish: "P".to_string(),
            village: "V".to_string(),
            plot_number: "Plot 1".to_string(),
            size_acres: 1.0,
            coordinates: None,
            ipfs_document_cid: None,
        });

        assert!(blockchain.add_transaction(Transaction::Register { title: title1 }).is_ok());
        let err = blockchain.add_transaction(Transaction::Register { title: title2 }).unwrap_err();
        assert!(err.contains("already registered"));
    }

    #[test]
    fn test_tampered_hash_detected() {
        let mut blockchain = Blockchain::new();
        let title = LandTitle::new(RegisterTitleRequest {
            owner_name: "Alice".to_string(),
            national_id: "ID1".to_string(),
            district: "D".to_string(),
            county: "C".to_string(),
            sub_county: "S".to_string(),
            parish: "P".to_string(),
            village: "V".to_string(),
            plot_number: "Plot 1".to_string(),
            size_acres: 1.0,
            coordinates: None,
            ipfs_document_cid: None,
        });
        blockchain.add_transaction(Transaction::Register { title }).unwrap();
        
        blockchain.chain[1].nonce += 1;
        assert!(!blockchain.is_valid());
    }

    #[test]
    fn test_tampered_previous_hash_detected() {
        let mut blockchain = Blockchain::new();
        let title = LandTitle::new(RegisterTitleRequest {
            owner_name: "Alice".to_string(),
            national_id: "ID1".to_string(),
            district: "D".to_string(),
            county: "C".to_string(),
            sub_county: "S".to_string(),
            parish: "P".to_string(),
            village: "V".to_string(),
            plot_number: "Plot 1".to_string(),
            size_acres: 1.0,
            coordinates: None,
            ipfs_document_cid: None,
        });
        blockchain.add_transaction(Transaction::Register { title }).unwrap();
        
        blockchain.chain[1].previous_hash = "fake_hash".to_string();
        let new_hash = blockchain.chain[1].calculate_hash();
        blockchain.chain[1].hash = new_hash;
        
        assert!(!blockchain.is_valid());
    }

    #[test]
    fn test_transfer_nonexistent_title() {
        let mut blockchain = Blockchain::new();
        let req = crate::models::TransferTitleRequest {
            to_owner: "Bob".to_string(),
            to_national_id: "ID2".to_string(),
        };
        let res = blockchain.transfer_title("FAKE-ID", &req);
        assert!(res.is_err());
    }

    #[test]
    fn test_transfer_updates_ownership() {
        let mut blockchain = Blockchain::new();
        let title = LandTitle::new(RegisterTitleRequest {
            owner_name: "Alice".to_string(),
            national_id: "ID1".to_string(),
            district: "D".to_string(),
            county: "C".to_string(),
            sub_county: "S".to_string(),
            parish: "P".to_string(),
            village: "V".to_string(),
            plot_number: "Plot 2".to_string(),
            size_acres: 1.0,
            coordinates: None,
            ipfs_document_cid: None,
        });
        let title_id = title.title_id.clone();
        blockchain.add_transaction(Transaction::Register { title }).unwrap();

        let req = crate::models::TransferTitleRequest {
            to_owner: "Bob".to_string(),
            to_national_id: "ID2".to_string(),
        };
        blockchain.transfer_title(&title_id, &req).unwrap();

        let updated = blockchain.get_title(&title_id).unwrap();
        assert_eq!(updated.owner_name, "Bob");
        assert_eq!(updated.national_id, "ID2");
    }

    #[test]
    fn test_search_by_district() {
        let mut blockchain = Blockchain::new();
        let title = LandTitle::new(RegisterTitleRequest {
            owner_name: "Alice".to_string(),
            national_id: "ID1".to_string(),
            district: "Jinja".to_string(),
            county: "C".to_string(),
            sub_county: "S".to_string(),
            parish: "P".to_string(),
            village: "V".to_string(),
            plot_number: "Plot 2".to_string(),
            size_acres: 1.0,
            coordinates: None,
            ipfs_document_cid: None,
        });
        blockchain.add_transaction(Transaction::Register { title }).unwrap();

        let results = blockchain.search_titles("", Some("Jinja"));
        assert_eq!(results.len(), 1);
        
        let empty_results = blockchain.search_titles("", Some("Kampala"));
        assert_eq!(empty_results.len(), 0);
    }
}
