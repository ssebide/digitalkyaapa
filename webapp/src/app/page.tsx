export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">🇺🇬 Blockchain-Powered Land Registry</div>
          <h1>
            Securing Uganda&apos;s Land <span className="highlight">Titles</span> on the Blockchain
          </h1>
          <p>
            DigitalKyapa uses blockchain technology to create tamper-proof, transparent records of land
            ownership — ending land wrangles and protecting every Ugandan&apos;s property rights.
          </p>
          <div className="hero-buttons">
            <a href="/search" className="btn btn-primary btn-lg">
              🔍 Search Titles
            </a>
            <a href="/register" className="btn btn-secondary btn-lg">
              📝 Register a Title
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-bar">
        <div className="stat-item">
          <div className="stat-number">100%</div>
          <div className="stat-label">Tamper-proof Records</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">24/7</div>
          <div className="stat-label">Access Availability</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">SHA-256</div>
          <div className="stat-label">Cryptographic Security</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">0</div>
          <div className="stat-label">Land Wrangles</div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="section-title">
          <h2>Why DigitalKyapa?</h2>
          <p>Built for Uganda, powered by blockchain technology</p>
        </div>
        <div className="features-grid">
          <div className="card card-glow">
            <div className="feature-icon gold">🔗</div>
            <div className="feature-title">Immutable Records</div>
            <div className="feature-desc">
              Every land title is recorded on the blockchain with SHA-256 cryptographic hashing.
              Once registered, records cannot be altered or deleted — your title is safe forever.
            </div>
          </div>
          <div className="card card-glow">
            <div className="feature-icon green">🔍</div>
            <div className="feature-title">Instant Verification</div>
            <div className="feature-desc">
              Verify any land title in seconds. Search by title ID, owner name, national ID,
              district, or plot number. Know exactly who owns what land.
            </div>
          </div>
          <div className="card card-glow">
            <div className="feature-icon red">🛡️</div>
            <div className="feature-title">Fraud Prevention</div>
            <div className="feature-desc">
              No more fake titles or double registrations. The blockchain ensures each plot of land
              has one verified owner with a complete, transparent ownership history.
            </div>
          </div>
          <div className="card card-glow">
            <div className="feature-icon gold">📋</div>
            <div className="feature-title">Complete History</div>
            <div className="feature-desc">
              Track the full ownership history of any land parcel. Every transfer, every owner —
              all transparently recorded on the blockchain.
            </div>
          </div>
          <div className="card card-glow">
            <div className="feature-icon green">🏘️</div>
            <div className="feature-title">Uganda-Specific</div>
            <div className="feature-desc">
              Designed for Uganda&apos;s land system. Supports all districts, counties, sub-counties,
              parishes, and villages across the country.
            </div>
          </div>
          <div className="card card-glow">
            <div className="feature-icon red">🤝</div>
            <div className="feature-title">Secure Transfers</div>
            <div className="feature-desc">
              Transfer land ownership securely through the blockchain. Both parties are recorded,
              creating an indisputable chain of custody.
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: "60px 2rem 80px", textAlign: "center" }}>
        <div className="card" style={{ maxWidth: 700, margin: "0 auto", padding: "48px 40px" }}>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Ready to Secure Your Land?
          </h2>
          <p style={{ color: "var(--gray-light)", marginBottom: 28, fontSize: "1.05rem" }}>
            Register your land title on the blockchain today and protect your property rights forever.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/register" className="btn btn-green btn-lg">
              Register Now
            </a>
            <a href="/search" className="btn btn-secondary btn-lg">
              Verify a Title
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
