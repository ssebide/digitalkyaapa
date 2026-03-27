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
          setError("Record not found on the ledger.");
        }

        if (historyData.success) {
          setHistory(historyData.data || []);
        }
      } catch {
        setError("Network error connecting to the blockchain node.");
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
        setTransferSuccess(`Ownership cryptographically verified to ${body.to_owner}.`);
        setShowTransfer(false);
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
      setError("Smart contract execution failed.");
    } finally {
      setTransferLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-UG", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="container spinner-wrap">
        <div className="spinner-modern"></div>
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="container" style={{ paddingTop: 100, maxWidth: 600 }}>
        <div className="banner banner-error">{error}</div>
        <a href="/search" className="btn btn-secondary" style={{ marginTop: 24 }}>← Return to Ledger Search</a>
      </div>
    );
  }

  if (!title) return null;

  return (
    <div className="container" style={{ paddingBottom: 120, paddingTop: 60, maxWidth: 900 }}>
      {/* Glow Effect */}
      <div className="hero-glow" style={{ top: "20%", background: "radial-gradient(circle at center, rgba(245, 215, 110, 0.08) 0%, transparent 60%)" }} />

      <a href="/search" className="btn btn-secondary" style={{ marginBottom: 40, height: 36, padding: "0 16px", fontSize: "0.85rem" }}>
        ← Explore Ledger
      </a>

      <div className="animate-fade-up">
        <div style={{ fontFamily: "monospace", color: "var(--accent-gold)", fontSize: "1rem", letterSpacing: "1px", marginBottom: 8 }}>
          {title.title_id}
        </div>
        <h1 style={{ fontFamily: "Space Grotesk", fontSize: "3rem", fontWeight: 700, marginBottom: 12 }}>
          {title.owner_name}
        </h1>
        <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 4, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-light)", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
          Status: <strong style={{ color: "var(--text-main)" }}>{title.status}</strong>
        </div>
      </div>

      {transferSuccess && <div className="banner banner-success animate-fade-up delay-1" style={{ marginTop: 40 }}>{transferSuccess}</div>}
      {error && <div className="banner banner-error animate-fade-up delay-1" style={{ marginTop: 40 }}>{error}</div>}

      <div className="detail-grid animate-fade-up delay-1">
        <div className="detail-item">
          <div className="detail-label">National Identity</div>
          <div className="detail-val mono">{title.national_id}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">District</div>
          <div className="detail-val">{title.district}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">County</div>
          <div className="detail-val">{title.county}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Sub County</div>
          <div className="detail-val">{title.sub_county}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Parish</div>
          <div className="detail-val">{title.parish}</div>
        </div>
        <div className="detail-item">
          <div className="detail-label">Village</div>
          <div className="detail-val">{title.village}</div>
        </div>
        <div className="detail-item" style={{ gridColumn: "1 / -1" }}>
          <div className="detail-label">Geographical Coordinates</div>
          <div className="detail-val" style={{ color: "var(--text-muted)" }}>{title.coordinates || "Unmapped Protocol Area"}</div>
        </div>
        <div className="detail-item" style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="detail-label">Plot & Acreage</div>
            <div className="detail-val">Plot {title.plot_number} ({title.size_acres} Acres)</div>
          </div>
          {title.status !== "Revoked" && (
            <button className="btn btn-primary" onClick={() => setShowTransfer(!showTransfer)}>
              Execute Transfer
            </button>
          )}
        </div>
      </div>

      {showTransfer && (
        <form onSubmit={handleTransfer} className="glass-card animate-fade-up" style={{ marginBottom: 40 }}>
          <h3 style={{ fontFamily: "Space Grotesk", fontSize: "1.2rem", marginBottom: 20 }}>Initate Smart Contract Transfer</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div className="form-group">
              <label>Beneficiary Name</label>
              <input type="text" className="input-modern" name="to_owner" required placeholder="Receiving Owner" />
            </div>
            <div className="form-group">
              <label>Beneficiary National ID</label>
              <input type="text" className="input-modern" name="to_national_id" required placeholder="ID Number" />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowTransfer(false)}>Abort</button>
              <button type="submit" className="btn btn-accent" disabled={transferLoading}>
                {transferLoading ? "Awaiting Block..." : "Sign & Transfer"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="animate-fade-up delay-2">
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: "1.8rem", marginBottom: 12 }}>Ledger Provenance</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>Immutable cryptographic history of ownership transfers.</p>

        {history.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", color: "var(--text-muted)" }}>No historical blocks found.</div>
        ) : (
          <div className="modern-timeline">
            {history.map((entry, i) => {
              const [blockIndex, timestamp, tx] = entry;
              const isRegister = !!tx.Register;
              return (
                <div key={i} className="timeline-event">
                  <div className="timeline-dot" />
                  <div className="timeline-date">Block Hash Index #{blockIndex} • {formatDate(timestamp)}</div>
                  <div className="timeline-content">
                    {isRegister ? (
                      <div>
                        <strong style={{ color: "var(--accent-green)" }}>Genesis Registration</strong><br />
                        Mined by owner <strong style={{ color: "var(--text-main)" }}>{tx.Register?.title.owner_name}</strong>
                      </div>
                    ) : (
                      <div>
                        <strong style={{ color: "var(--accent-gold)" }}>Digital Transfer</strong><br />
                        Provenance transferred from <strong>{tx.Transfer?.from_owner}</strong> to <strong style={{ color: "var(--text-main)" }}>{tx.Transfer?.to_owner}</strong>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
