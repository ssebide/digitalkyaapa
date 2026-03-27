# DigitalKyapa 🇺🇬

**Blockchain-Based Land Title Registry for Uganda**

A decentralized system to securely store and verify Ugandan land titles digitally, eliminating land wrangles through immutable, transparent ownership records on the blockchain.

## Architecture

| Component | Technology | Port |
|-----------|-----------|------|
| Blockchain Backend | Rust + Actix-web | `localhost:8080` |
| Web Frontend | Next.js + TypeScript | `localhost:3000` |

## Quick Start

### 1. Start the Blockchain Backend

```bash
cd blockchain
cargo build
cargo run
```

The API server starts at `http://localhost:8080`.

### 2. Start the Web Frontend

```bash
cd webapp
npm install
npm run dev
```

Visit `http://localhost:3000` in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/titles` | List all registered titles |
| `GET` | `/api/titles/search?query=` | Search titles by name/ID/location |
| `GET` | `/api/titles/{id}` | Get a specific title |
| `GET` | `/api/titles/{id}/history` | Get ownership history |
| `POST` | `/api/titles` | Register a new land title |
| `POST` | `/api/titles/{id}/transfer` | Transfer title ownership |
| `GET` | `/api/chain` | View the full blockchain |
| `GET` | `/api/chain/verify` | Verify blockchain integrity |
| `GET` | `/api/stats` | Get blockchain statistics |

## Features

- **SHA-256 Hashing** — Each block is cryptographically hashed
- **Proof-of-Work** — Mining with configurable difficulty
- **Chain Validation** — Full chain integrity verification
- **Uganda-Specific** — All 100+ districts, county/sub-county/parish/village hierarchy
- **Ownership Transfers** — Secure transfer with full audit trail
- **Search** — By title ID, owner name, national ID, district, or plot number
- **Persistent Storage** — Blockchain saved to JSON file

## Project Structure

```
digitalkyapa/
├── blockchain/           # Rust blockchain backend
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs       # Server entry point
│       ├── blockchain.rs # Core blockchain engine
│       ├── models.rs     # Data models
│       └── api.rs        # REST API handlers
│
├── webapp/               # Next.js frontend
│   ├── package.json
│   ├── next.config.js    # API proxy config
│   └── src/app/
│       ├── layout.tsx    # Root layout
│       ├── globals.css   # Design system
│       ├── page.tsx      # Landing page
│       ├── search/       # Title search page
│       ├── register/     # Title registration page
│       └── titles/[id]/  # Title detail page
│
└── README.md
```
