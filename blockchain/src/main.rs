mod api;
mod blockchain;
mod models;

use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use std::sync::RwLock;

use blockchain::Blockchain;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("╔══════════════════════════════════════════════════╗");
    println!("║     🇺🇬  DigitalKyapa - Land Title Blockchain  🇺🇬    ║");
    println!("║          Securing Uganda's Land Rights          ║");
    println!("╚══════════════════════════════════════════════════╝");
    println!();

    let blockchain = Blockchain::load();
    let data = web::Data::new(RwLock::new(blockchain));

    println!("🚀 Starting server at http://localhost:8080");
    println!("📡 API endpoints:");
    println!("   GET  /api/titles          - List all titles");
    println!("   GET  /api/titles/search   - Search titles");
    println!("   GET  /api/titles/{{id}}     - Get title by ID");
    println!("   POST /api/titles          - Register new title");
    println!("   POST /api/titles/{{id}}/transfer - Transfer title");
    println!("   GET  /api/chain           - View blockchain");
    println!("   GET  /api/chain/verify    - Verify integrity");
    println!("   GET  /api/stats           - Statistics");
    println!();

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        let json_config = web::JsonConfig::default().limit(256 * 1024); // 256 KB limit

        App::new()
            .wrap(cors)
            .app_data(data.clone())
            .app_data(json_config)
            // Title endpoints
            .route("/api/titles", web::get().to(api::get_all_titles))
            .route("/api/titles/search", web::get().to(api::search_titles))
            .route("/api/titles/{title_id}", web::get().to(api::get_title))
            .route(
                "/api/titles/{title_id}/history",
                web::get().to(api::get_title_history),
            )
            .route("/api/titles", web::post().to(api::register_title))
            .route(
                "/api/titles/{title_id}/transfer",
                web::post().to(api::transfer_title),
            )
            // Chain endpoints
            .route("/api/chain", web::get().to(api::get_chain))
            .route("/api/chain/verify", web::get().to(api::verify_chain))
            .route("/api/stats", web::get().to(api::get_stats))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
