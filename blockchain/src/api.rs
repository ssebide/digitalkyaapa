use actix_web::{web, HttpResponse};
use std::sync::RwLock;

use crate::blockchain::Blockchain;
use crate::models::{
    ApiResponse, LandTitle, RegisterTitleRequest, SearchQuery, Transaction, TransferTitleRequest,
};

pub type BlockchainState = web::Data<RwLock<Blockchain>>;

/// Helper to safely lock the blockchain state for reading
macro_rules! read_chain {
    ($blockchain:expr) => {
        match $blockchain.read() {
            Ok(guard) => guard,
            Err(_) => return HttpResponse::InternalServerError().json(ApiResponse::<()>::error(
                "Internal server error: State lock poisoned",
            )),
        }
    };
}

/// Helper to safely lock the blockchain state for writing
macro_rules! write_chain {
    ($blockchain:expr) => {
        match $blockchain.write() {
            Ok(guard) => guard,
            Err(_) => return HttpResponse::InternalServerError().json(ApiResponse::<()>::error(
                "Internal server error: State lock poisoned",
            )),
        }
    };
}

/// GET /api/titles — List all titles
pub async fn get_all_titles(blockchain: BlockchainState) -> HttpResponse {
    let chain = read_chain!(blockchain);
    let titles = chain.get_all_titles();
    HttpResponse::Ok().json(ApiResponse::success(
        &format!("Found {} titles", titles.len()),
        titles,
    ))
}

/// GET /api/titles/search?query=&district= — Search titles
pub async fn search_titles(
    blockchain: BlockchainState,
    query: web::Query<SearchQuery>,
) -> HttpResponse {
    let chain = read_chain!(blockchain);

    let search_query = query.query.as_deref().unwrap_or("");
    if search_query.is_empty() && query.district.is_none() {
        return HttpResponse::BadRequest().json(ApiResponse::<Vec<LandTitle>>::error(
            "Please provide a search query or district filter",
        ));
    }

    let results = chain.search_titles(search_query, query.district.as_deref());
    HttpResponse::Ok().json(ApiResponse::success(
        &format!("Found {} matching titles", results.len()),
        results,
    ))
}

/// GET /api/titles/{title_id} — Get title by ID
pub async fn get_title(
    blockchain: BlockchainState,
    path: web::Path<String>,
) -> HttpResponse {
    let title_id = path.into_inner();
    let chain = read_chain!(blockchain);

    match chain.get_title(&title_id) {
        Some(title) => HttpResponse::Ok().json(ApiResponse::success("Title found", title)),
        None => HttpResponse::NotFound().json(ApiResponse::<LandTitle>::error(
            &format!("Title {} not found", title_id),
        )),
    }
}

/// GET /api/titles/{title_id}/history — Get title history
pub async fn get_title_history(
    blockchain: BlockchainState,
    path: web::Path<String>,
) -> HttpResponse {
    let title_id = path.into_inner();
    let chain = read_chain!(blockchain);

    let history = chain.get_title_history(&title_id);
    if history.is_empty() {
        return HttpResponse::NotFound().json(ApiResponse::<Vec<()>>::error(
            &format!("No history found for title {}", title_id),
        ));
    }

    HttpResponse::Ok().json(ApiResponse::success(
        &format!("Found {} records for title {}", history.len(), title_id),
        history,
    ))
}

/// POST /api/titles — Register a new title
pub async fn register_title(
    blockchain: BlockchainState,
    body: web::Json<RegisterTitleRequest>,
) -> HttpResponse {
    if let Err(e) = body.validate() {
        return HttpResponse::BadRequest().json(ApiResponse::<LandTitle>::error(&e.0));
    }

    let mut chain = write_chain!(blockchain);
    let title = LandTitle::new(body.into_inner());
    let title_id = title.title_id.clone();

    let transaction = Transaction::Register {
        title: title.clone(),
    };
    match chain.add_transaction(transaction) {
        Ok(block) => HttpResponse::Created().json(ApiResponse::success(
            &format!(
                "Title {} registered successfully in block #{}",
                title_id, block.index
            ),
            title,
        )),
        Err(e) => HttpResponse::BadRequest().json(ApiResponse::<LandTitle>::error(&e)),
    }
}

/// POST /api/titles/{title_id}/transfer — Transfer title ownership
pub async fn transfer_title(
    blockchain: BlockchainState,
    path: web::Path<String>,
    body: web::Json<TransferTitleRequest>,
) -> HttpResponse {
    if let Err(e) = body.validate() {
        return HttpResponse::BadRequest().json(ApiResponse::<LandTitle>::error(&e.0));
    }

    let title_id = path.into_inner();
    let mut chain = write_chain!(blockchain);

    match chain.transfer_title(&title_id, &body.into_inner()) {
        Ok(block) => {
            let block_index = block.index;
            let updated_title = chain.get_title(&title_id);
            HttpResponse::Ok().json(ApiResponse::success(
                &format!(
                    "Title {} transferred successfully in block #{}",
                    title_id, block_index
                ),
                updated_title,
            ))
        }
        Err(e) => HttpResponse::BadRequest().json(ApiResponse::<LandTitle>::error(&e)),
    }
}

/// GET /api/chain — View full blockchain
pub async fn get_chain(blockchain: BlockchainState) -> HttpResponse {
    let chain = read_chain!(blockchain);
    HttpResponse::Ok().json(ApiResponse::success(
        &format!("Blockchain has {} blocks", chain.chain.len()),
        &chain.chain,
    ))
}

/// GET /api/chain/verify — Verify chain integrity
pub async fn verify_chain(blockchain: BlockchainState) -> HttpResponse {
    let chain = read_chain!(blockchain);
    let is_valid = chain.is_valid();

    #[derive(serde::Serialize)]
    struct VerifyResult {
        is_valid: bool,
        total_blocks: usize,
        total_titles: usize,
    }

    let result = VerifyResult {
        is_valid,
        total_blocks: chain.chain.len(),
        total_titles: chain.get_all_titles().len(),
    };

    if is_valid {
        HttpResponse::Ok().json(ApiResponse::success(
            "✅ Blockchain is valid and untampered",
            result,
        ))
    } else {
        HttpResponse::Ok().json(ApiResponse::success(
            "⚠️ Blockchain integrity compromised!",
            result,
        ))
    }
}

/// GET /api/stats — Get blockchain statistics
pub async fn get_stats(blockchain: BlockchainState) -> HttpResponse {
    let chain = read_chain!(blockchain);
    let titles = chain.get_all_titles();

    #[derive(serde::Serialize)]
    struct Stats {
        total_blocks: usize,
        total_titles: usize,
        total_districts: usize,
        districts: Vec<String>,
        is_valid: bool,
    }

    let mut districts: Vec<String> = titles.iter().map(|t| t.district.clone()).collect();
    districts.sort();
    districts.dedup();

    let stats = Stats {
        total_blocks: chain.chain.len(),
        total_titles: titles.len(),
        total_districts: districts.len(),
        districts,
        is_valid: chain.is_valid(),
    };

    HttpResponse::Ok().json(ApiResponse::success("Blockchain statistics", stats))
}
