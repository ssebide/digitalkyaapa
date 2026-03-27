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
      setError("Unable to connect to the blockchain server. Please ensure the server is running on port 8080.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return "✅";
      case "Transferred":
        return "🔄";
      case "Disputed":
        return "⚠️";
      case "Revoked":
        return "❌";
      default:
        return "📄";
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Active":
        return "active";
      case "Transferred":
        return "transferred";
      case "Disputed":
        return "disputed";
      default:
        return "active";
    }
  };

  return (
    <section className="search-section">
      <div className="search-header">
        <h1>
          Search Land <span style={{ color: "var(--gold)" }}>Titles</span>
        </h1>
        <p>Search by Title ID, Owner Name, National ID, District, or Plot Number</p>
      </div>

      <form onSubmit={handleSearch} className="search-box">
        <input
          type="text"
          className="input"
          placeholder="e.g. UG-A1B2C3D4, John Mukasa, Wakiso, Block 123 Plot 45..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          id="search-input"
        />
        <button type="submit" className="btn btn-primary" id="search-button" disabled={loading}>
          {loading ? "Searching..." : "🔍 Search"}
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>No titles found matching &quot;{query}&quot;</p>
          <p style={{ fontSize: "0.85rem", marginTop: 8 }}>
            Try searching with a different term or check the Title ID format (e.g. UG-XXXXXXXX)
          </p>
        </div>
      )}

      <div className="results-list">
        {results.map((title) => (
          <div key={title.title_id} className="card title-card">
            <div className={`title-card-status ${getStatusClass(title.status)}`}>
              {getStatusIcon(title.status)}
            </div>
            <div className="title-card-info">
              <div className="title-card-id">{title.title_id}</div>
              <h3>{title.owner_name}</h3>
              <div className="title-card-location">
                📍 {title.village}, {title.parish}, {title.district} — {title.plot_number} ({title.size_acres} acres)
              </div>
            </div>
            <div className="title-card-action">
              <a href={`/titles/${title.title_id}`} className="btn btn-secondary">
                View Details →
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
