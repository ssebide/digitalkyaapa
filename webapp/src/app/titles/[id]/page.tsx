"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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

interface HistoryEntry {
  0: number; // block index
  1: string; // timestamp
  2: {
    Register?: { title: LandTitle };
    Transfer?: {
      title_id: string;
      from_owner: string;
      from_national_id: string;
      to_owner: string;
      to_national_id: string;
      timestamp: string;
    };
  };
}

export default function TitleDetailPage() {
  const params = useParams();
  const titleId = params.id as string;

  const [title, setTitle] = useState<LandTitle | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Transfer state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [titleRes, historyRes] = await Promise.all([
          fetch(`/api/titles/${titleId}`),
          fetch(`/api/titles/${titleId}/history`),
        ]);

        const titleData = await titleRes.json();
        const historyData = await historyRes.json();

        if (titleData.success) {
          setTitle(titleData.data);
        } else {
          setError("Title not found on the blockchain");
        }

        if (historyData.success) {
          setHistory(historyData.data || []);
        }
      } catch {
        setError("Unable to connect to the blockchain server. Ensure it is running on port 8080.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [titleId]);

  const handleTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTransferLoading(true);

    const formData = new FormData(e.currentTarget);
    const body = {
      to_owner: formData.get("to_owner") as string,
      to_national_id: formData.get("to_national_id") as string,
    };

    try {
      const res = await fetch(`/api/titles/${titleId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setTransferSuccess(`Title transferred to ${body.to_owner} successfully!`);
        setShowTransfer(false);
        // Refresh data
        const titleRes = await fetch(`/api/titles/${titleId}`);
        const historyRes = await fetch(`/api/titles/${titleId}/history`);
        const titleData = await titleRes.json();
        const historyData = await historyRes.json();
        if (titleData.success) setTitle(titleData.data);
        if (historyData.success) setHistory(historyData.data || []);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Transfer failed. Ensure the blockchain server is running.");
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="detail-section">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </section>
    );
  }

  if (error && !title) {
    return (
      <section className="detail-section">
        <div className="error-banner">{error}</div>
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p>Title {titleId} was not found on the blockchain</p>
          <a href="/search" className="btn btn-primary" style={{ marginTop: 20 }}>
            ← Back to Search
          </a>
        </div>
      </section>
    );
  }

  if (!title) return null;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-UG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section className="detail-section">
      {/* Header */}
      <div className="detail-header">
        <a href="/search" className="btn btn-secondary" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
          ← Back
        </a>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "monospace", color: "var(--gold)", fontSize: "0.9rem", fontWeight: 600 }}>
            {title.title_id}
          </div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.8rem", fontWeight: 700, marginTop: 4 }}>
            {title.owner_name}
          </h1>
        </div>
        <div className={`detail-badge ${title.status.toLowerCase()}`}>{title.status}</div>
      </div>

      {transferSuccess && <div className="success-banner">✅ {transferSuccess}</div>}
      {error && title && <div className="error-banner">❌ {error}</div>}

      {/* Title Details */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1.2rem",
            fontWeight: 600,
            marginBottom: 20,
            color: "var(--gold)",
          }}
        >
          📋 Title Information
        </h2>
        <div className="detail-grid">
          <div className="detail-item">
            <div className="detail-item-label">Title ID</div>
            <div className="detail-item-value" style={{ fontFamily: "monospace" }}>{title.title_id}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Owner</div>
            <div className="detail-item-value">{title.owner_name}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">National ID</div>
            <div className="detail-item-value" style={{ fontFamily: "monospace" }}>{title.national_id}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">District</div>
            <div className="detail-item-value">{title.district}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">County</div>
            <div className="detail-item-value">{title.county}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Sub County</div>
            <div className="detail-item-value">{title.sub_county}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Parish</div>
            <div className="detail-item-value">{title.parish}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Village</div>
            <div className="detail-item-value">{title.village}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Plot Number</div>
            <div className="detail-item-value">{title.plot_number}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Size</div>
            <div className="detail-item-value">{title.size_acres} Acres</div>
          </div>
          {title.coordinates && (
            <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
              <div className="detail-item-label">GPS Coordinates</div>
              <div className="detail-item-value">{title.coordinates}</div>
            </div>
          )}
          <div className="detail-item">
            <div className="detail-item-label">Registered</div>
            <div className="detail-item-value">{formatDate(title.registered_at)}</div>
          </div>
          <div className="detail-item">
            <div className="detail-item-label">Status</div>
            <div className="detail-item-value">
              {title.status === "Active" ? "✅" : title.status === "Transferred" ? "🔄" : "⚠️"}{" "}
              {title.status}
            </div>
          </div>
        </div>

        {/* Transfer Button */}
        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={() => setShowTransfer(!showTransfer)}
          >
            🔄 Transfer Ownership
          </button>
        </div>

        {/* Transfer Form */}
        {showTransfer && (
          <form onSubmit={handleTransfer} style={{ marginTop: 24, padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius)", border: "1px solid var(--glass-border)" }}>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1rem", fontWeight: 600, marginBottom: 16 }}>
              Transfer to New Owner
            </h3>
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="to_owner">New Owner Full Name</label>
                <input type="text" className="input" id="to_owner" name="to_owner" placeholder="e.g. Jane Nakato" required />
              </div>
              <div className="input-group">
                <label htmlFor="to_national_id">New Owner National ID</label>
                <input type="text" className="input" id="to_national_id" name="to_national_id" placeholder="e.g. CF9876543210" required />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransfer(false)}>Cancel</button>
                <button type="submit" className="btn btn-green" disabled={transferLoading}>
                  {transferLoading ? "Processing..." : "⛓️ Confirm Transfer"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Ownership History */}
      <div className="card">
        <h2
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: "1.2rem",
            fontWeight: 600,
            marginBottom: 24,
            color: "var(--gold)",
          }}
        >
          📜 Ownership History (Blockchain)
        </h2>

        {history.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <p>No history available</p>
          </div>
        ) : (
          <div className="timeline">
            {history.map((entry, i) => {
              const blockIndex = entry[0];
              const timestamp = entry[1];
              const tx = entry[2];

              if (tx.Register) {
                return (
                  <div key={i} className="timeline-item">
                    <div className="timeline-date">
                      Block #{blockIndex} — {formatDate(timestamp)}
                    </div>
                    <div className="timeline-content">
                      🆕 <strong>Title Registered</strong> — Owner: {tx.Register.title.owner_name} (
                      {tx.Register.title.national_id})
                    </div>
                  </div>
                );
              }

              if (tx.Transfer) {
                return (
                  <div key={i} className="timeline-item">
                    <div className="timeline-date">
                      Block #{blockIndex} — {formatDate(timestamp)}
                    </div>
                    <div className="timeline-content">
                      🔄 <strong>Ownership Transferred</strong>
                      <br />
                      From: {tx.Transfer.from_owner} → To: {tx.Transfer.to_owner}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
