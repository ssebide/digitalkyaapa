export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-glow"></div>
        <div className="container">
          <div className="hero-badge animate-fade-up">
            <span></span> Live on the Blockchain
          </div>
          <h1 className="animate-fade-up delay-1">
            Immutable Land Titles for a Secure Uganda
          </h1>
          <p className="hero-sub animate-fade-up delay-2">
            DigitalKyapa leverages cryptographic zero-trust architecture to create
            tamper-proof land records. Eradicate fraud, resolve disputes, and
            verify ownership instantly.
          </p>
          <div className="hero-actions animate-fade-up delay-3">
            <a href="/search" className="btn btn-primary btn-lg">
              Verify Title
            </a>
            <a href="/register" className="btn btn-secondary btn-lg">
              Register Land
            </a>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-header animate-fade-up">
            <h2>The New Standard of Trust</h2>
            <p>Built exclusively for the Ugandan land registry ecosystem.</p>
          </div>

          <div className="bento-grid">
            {/* Bento Card 1 (Wide) */}
            <div className="bento-card bento-wide animate-fade-up delay-1">
              <div className="bento-icon">⛓️</div>
              <h3 className="bento-title">Cryptographic Immutability</h3>
              <p className="bento-desc">
                Every transaction is hashed using SHA-256 and linked perpetually. 
                Once a title is registered or transferred, the record cannot be 
                altered or deleted by any central authority.
              </p>
            </div>

            {/* Bento Card 2 (Standard) */}
            <div className="bento-card animate-fade-up delay-2">
              <div className="bento-icon">⚡</div>
              <h3 className="bento-title">Instant Verification</h3>
              <p className="bento-desc">
                Query the distributed ledger in milliseconds to verify absolute ownership 
                and view complete historical provenance of any plot.
              </p>
            </div>

            {/* Bento Card 3 (Standard) */}
            <div className="bento-card animate-fade-up delay-1">
              <div className="bento-icon">🛡️</div>
              <h3 className="bento-title">Zero Friction Transfers</h3>
              <p className="bento-desc">
                Transfer ownership digitally with guaranteed finality. The smart 
                contract logic prevents double-spending and unauthorized claims.
              </p>
            </div>

            {/* Bento Card 4 (Wide) */}
            <div className="bento-card bento-wide animate-fade-up delay-2">
              <div className="bento-icon">🌍</div>
              <h3 className="bento-title">Nationwide Coverage</h3>
              <p className="bento-desc">
                From Kampala to Gulu, every district, county, and village is natively 
                mapped. GPS coordinates are anchored to precise blockchain states 
                for indisputable geographical boundaries.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
