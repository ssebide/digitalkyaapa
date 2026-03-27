"use client";

import { useState } from "react";

interface LandTitle {
  title_id: string;
  owner_name: string;
  national_id: string;
  district: string;
  county: string;
  sub_county: string;
  parish: string;
  village: string;
  plot_number: string;
  size_acres: number;
  coordinates: string | null;
  registered_at: string;
  status: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: LandTitle[] | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LandTitle[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const res = await fetch(`/api/titles/search?query=${encodeURIComponent(query)}`);
      const data: ApiResponse = await res.json();

      if (data.success && data.data) {
        setResults(data.data);
      } else {
        setResults([]);
        setError(data.message || "No results found");
      }
    } catch {
      setError("Unable to connect to the blockchain ledger.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const statusMap = {
    Active: { label: "Active", className: "status-Active" },
    Transferred: { label: "Transferred", className: "status-Transferred" },
    Disputed: { label: "Disputed", className: "status-Disputed" },
    Revoked: { label: "Revoked", className: "status-Revoked" },
  };

  return (
    <div className="container" style={{ paddingBottom: 120 }}>
      {/* Glow Effect */}
      <div className="hero-glow" style={{ top: "30%", opacity: 0.3 }} />

      <section className="search-container animate-fade-up">
        <div className="page-header">
          <h1>Verify Provenance</h1>
          <p>Instantly confirm authenticity by Title ID, Owner, or Geographical Identity.</p>
        </div>

        <form onSubmit={handleSearch} className="search-bar animate-fade-up delay-1">
          <div className="search-icon-abs">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
          <input
            type="text"
            className="input-modern"
            placeholder="e.g. UG-A1B2C3D4, John, Wakiso..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Querying..." : "Verify Record"}
          </button>
        </form>

        {error && <div className="banner banner-error animate-fade-up">{error}</div>}

        {loading && (
          <div className="spinner-wrap">
            <div className="spinner-modern"></div>
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="glass-card animate-fade-up" style={{ textAlign: "center", marginTop: 40 }}>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
              No cryptic records returned for &quot;<strong>{query}</strong>&quot;
            </p>
          </div>
        )}

        <div style={{ marginTop: 40 }}>
          {results.map((title, i) => {
            const statusInfo = statusMap[title.status as keyof typeof statusMap] || statusMap.Active;
            return (
              <a 
                href={`/titles/${title.title_id}`} 
                key={title.title_id} 
                className="result-card animate-fade-up"
                style={{ animationDelay: `${0.1 * (i + 1)}s` }}
              >
                <div className={`status-dot ${statusInfo.className}`}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 500, marginBottom: 4 }}>
                    {title.owner_name}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {title.district} — {title.plot_number} • {title.size_acres} Acres
                  </div>
                </div>
                <div style={{ fontFamily: "monospace", color: "var(--accent-gold)", fontSize: "0.85rem", letterSpacing: "1px" }}>
                  {title.title_id}
                </div>
                <div style={{ color: "var(--border-light)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </div>
  );
}
