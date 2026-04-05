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
  ipfs_document_cid: string | null;
  registered_at: string;
  status: string;
  zoning: string;
  active_leases: Lease[];
}

interface Lease {
  lease_id: string;
  title_id: string;
  lessee_name: string;
  lessee_national_id: string;
  duration_months: number;
  start_date: string;
  active: boolean;
}

type HistoryEntry = [
  number, // block index
  string, // timestamp
  {
    Register?: { title: LandTitle };
    Transfer?: { from_owner: string; to_owner: string };
    InitiateTransfer?: { from_owner: string; to_owner: string };
    ApproveTransfer?: { new_owner: string };
    AddCaveat?: { caveat: { placed_by: string; reason: string } };
    RemoveCaveat?: { removed_at: string };
    RegisterLease?: { lease: Lease };
    TerminateLease?: { lease_id: string; terminated_at: string };
  }
];

export default function TitleDetailPage() {
  const params = useParams();
  const titleId = params.id as string;

  const [title, setTitle] = useState<LandTitle | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showTransfer, setShowTransfer] = useState(false);
  const [showCaveatForm, setShowCaveatForm] = useState(false);
  const [showLeaseForm, setShowLeaseForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const refreshData = async () => {
    try {
      const [titleRes, historyRes] = await Promise.all([
        fetch(`/api/titles/${titleId}`),
        fetch(`/api/titles/${titleId}/history`),
      ]);
      const titleData = await titleRes.json();
      const historyData = await historyRes.json();
      if (titleData.success) setTitle(titleData.data);
      if (historyData.success) setHistory(historyData.data || []);
    } catch {}
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [titleRes, historyRes] = await Promise.all([
          fetch(`/api/titles/${titleId}`),
          fetch(`/api/titles/${titleId}/history`),
        ]);
        const titleData = await titleRes.json();
        const historyData = await historyRes.json();

        if (titleData.success) setTitle(titleData.data);
        else setError("Record not found on the ledger.");
        
        if (historyData.success) setHistory(historyData.data || []);
      } catch {
        setError("Network error connecting to the blockchain node.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [titleId]);

  const handleAction = async (endpoint: string, method: string, body: any, successFeedback: string, closePanel: () => void) => {
    setActionLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch(`/api/titles/${titleId}${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body && { body: JSON.stringify(body) }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(successFeedback);
        closePanel();
        await refreshData();
      } else {
        setError(data.message);
      }
    } catch {
      setError("Smart contract execution failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitiateTransfer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleAction(
      "/transfer/initiate",
      "POST",
      { to_owner: formData.get("to_owner"), to_national_id: formData.get("to_national_id") },
      `Transfer initiated successfully.`,
      () => setShowTransfer(false)
    );
  };

  const handleApproveTransfer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleAction(
      "/transfer/approve",
      "POST",
      { new_national_id: formData.get("new_national_id") },
      `Transfer approved successfully!`,
      () => setShowTransfer(false)
    );
  };

  const handleAddCaveat = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleAction(
      "/caveat",
      "POST",
      { placed_by: formData.get("placed_by"), reason: formData.get("reason") },
      "Caveat successfully lodged on chain.",
      () => setShowCaveatForm(false)
    );
  };

  const handleRemoveCaveat = (caveatId: string) => {
    handleAction(`/caveat/${caveatId}`, "DELETE", null, "Caveat successfully lifted.", () => {});
  };

  const handleRegisterLease = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleAction(
      "/lease",
      "POST",
      { 
          lessee_name: formData.get("lessee_name"), 
          lessee_national_id: formData.get("lessee_national_id"),
          duration_months: parseInt(formData.get("duration_months") as string)
      },
      "Lease successfully registered on chain.",
      () => setShowLeaseForm(false)
    );
  };

  const handleTerminateLease = (leaseId: string) => {
    handleAction(`/lease/${leaseId}`, "DELETE", null, "Lease terminated.", () => {});
  };

  // Helper to find active caveat ID from history (if we need to remove it)
  // For UI simplicity, we just grab the last caveat ID from history that hasn't been removed
  const getLatestCaveatId = () => {
      let activeId = "";
      for (const entry of history) {
          if (entry[2].AddCaveat) {
              const caveat = (entry[2].AddCaveat as any).caveat;
              activeId = caveat?.caveat_id || "";
          }
          if (entry[2].RemoveCaveat) {
              activeId = "";
          }
      }
      return activeId;
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

  if (loading) return <div className="container spinner-wrap"><div className="spinner-modern"></div></div>;

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
      <div className="hero-glow" style={{ top: "20%", background: title.status === "Caveated" ? "radial-gradient(circle at center, rgba(239, 68, 68, 0.08) 0%, transparent 60%)" : "radial-gradient(circle at center, rgba(245, 215, 110, 0.08) 0%, transparent 60%)" }} />

      <a href="/search" className="btn btn-secondary" style={{ marginBottom: 40, height: 36, padding: "0 16px", fontSize: "0.85rem" }}>
        ← Explore Ledger
      </a>

      {title.status === "Caveated" && (
        <div className="banner banner-error animate-fade-up" style={{ marginBottom: 24, padding: "16px 20px" }}>
          <strong style={{ fontSize: "1.1rem" }}>DISPUTE CAVEAT ACTIVE</strong>
          <p style={{ marginTop: 8, fontSize: "0.9rem", opacity: 0.9 }}>This title has an active caveat and cannot be transferred until the dispute is legally resolved and removed from the chain.</p>
        </div>
      )}
      {title.status === "PendingTransfer" && (
        <div className="banner banner-success animate-fade-up" style={{ marginBottom: 24, padding: "16px 20px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
          <strong style={{ fontSize: "1.1rem", color: "#10B981" }}>TRANSFER PENDING</strong>
          <p style={{ marginTop: 8, fontSize: "0.9rem", color: "#A7F3D0" }}>A transfer has been initiated by the current owner. The new beneficiary must cryptographically approve it to finalize the exchange.</p>
        </div>
      )}

      {title.active_leases?.filter(l => l.active).map(lease => (
          <div key={lease.lease_id} className="banner animate-fade-up" style={{ marginBottom: 24, padding: "16px 20px", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "1.1rem", color: "#3B82F6" }}>ACTIVE LEASE ({lease.duration_months} Months)</strong>
                    <p style={{ marginTop: 8, fontSize: "0.9rem", color: "#93C5FD" }}>Leased to {lease.lessee_name} ({lease.lessee_national_id}). Registered on {formatDate(lease.start_date)}.</p>
                  </div>
                  <button className="btn btn-secondary" onClick={() => handleTerminateLease(lease.lease_id)} style={{ padding: "8px 16px", borderColor: "rgba(59, 130, 246, 0.5)", color: "#93C5FD" }} disabled={actionLoading}>
                    Terminate
                  </button>
              </div>
          </div>
      ))}

      <div className="animate-fade-up">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
            <div>
                <div style={{ fontFamily: "monospace", color: "var(--accent-gold)", fontSize: "1rem", letterSpacing: "1px", marginBottom: 8 }}>
                {title.title_id}
                </div>
                <h1 style={{ fontFamily: "Space Grotesk", fontSize: "3rem", fontWeight: 700, margin: 0, lineHeight: 1.1 }}>
                {title.owner_name}
                </h1>
            </div>
            <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 4, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-light)", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Status: <strong style={{ color: title.status === "Caveated" ? "var(--accent-red)" : "var(--text-main)" }}>{title.status}</strong>
            </div>
        </div>
        
        {title.ipfs_document_cid && (
            <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: "rgba(245, 215, 110, 0.15)", color: "var(--accent-gold)", padding: "4px 8px", borderRadius: 4, fontSize: "0.8rem", fontWeight: "bold" }}>IPFS VERIFIED</span>
                <span className="mono" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>CID: {title.ipfs_document_cid}</span>
            </div>
        )}
      </div>

      {successMsg && <div className="banner banner-success animate-fade-up delay-1" style={{ marginTop: 24 }}>{successMsg}</div>}
      {error && <div className="banner banner-error animate-fade-up delay-1" style={{ marginTop: 24 }}>{error}</div>}

      <div className="detail-grid animate-fade-up delay-1" style={{ marginTop: 32 }}>
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
        <div className="detail-item">
          <div className="detail-label">Zoning Type</div>
          <div className="detail-val">{title.zoning}</div>
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
          <div style={{ display: "flex", gap: 12 }}>
            <button className="btn btn-secondary" onClick={() => { setShowTransfer(false); setShowCaveatForm(false); setShowLeaseForm(!showLeaseForm); }}>
                Manage Leases
            </button>
            <button className="btn btn-secondary" onClick={() => { setShowTransfer(false); setShowLeaseForm(false); setShowCaveatForm(!showCaveatForm); }}>
                Manage Caveats
            </button>
            {title.status !== "Revoked" && title.status !== "Caveated" && (
                <button className="btn btn-primary" onClick={() => { setShowCaveatForm(false); setShowLeaseForm(false); setShowTransfer(!showTransfer); }}>
                {title.status === "PendingTransfer" ? "Approve Transfer" : "Initiate Transfer"}
                </button>
            )}
          </div>
        </div>
      </div>

      {showTransfer && (
        <form onSubmit={title.status === "PendingTransfer" ? handleApproveTransfer : handleInitiateTransfer} className="glass-card animate-fade-up" style={{ marginBottom: 40 }}>
          <h3 style={{ fontFamily: "Space Grotesk", fontSize: "1.2rem", marginBottom: 20 }}>
            {title.status === "PendingTransfer" ? "Approve Pending Ownership Transfer" : "Initiate Smart Contract Transfer"}
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            {title.status === "PendingTransfer" ? (
                <>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Beneficiary National ID (Provide to cryptographically authenticate)</label>
                  <input type="text" className="input-modern" name="new_national_id" required placeholder="ID Number of the New Owner" />
                </div>
                </>
            ) : (
                <>
                <div className="form-group">
                  <label>Beneficiary Name</label>
                  <input type="text" className="input-modern" name="to_owner" required placeholder="Receiving Owner" />
                </div>
                <div className="form-group">
                  <label>Beneficiary National ID</label>
                  <input type="text" className="input-modern" name="to_national_id" required placeholder="ID Number" />
                </div>
                </>
            )}

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowTransfer(false)}>Abort</button>
              <button type="submit" className="btn btn-accent" disabled={actionLoading}>
                {actionLoading ? "Awaiting Block..." : "Sign & Transfer"}
              </button>
            </div>
          </div>
        </form>
      )}

      {showCaveatForm && (
        <div className="glass-card animate-fade-up" style={{ marginBottom: 40, border: "1px solid rgba(239, 68, 68, 0.4)" }}>
            <h3 style={{ fontFamily: "Space Grotesk", fontSize: "1.2rem", marginBottom: 20, color: "var(--accent-red)" }}>Caveat Registry Management</h3>
            
            {title.status === "Caveated" ? (
                <div>
                     <p style={{ color: "var(--text-muted)", marginBottom: 20, fontSize: "0.95rem" }}>
                        Only the registry or a court orderee can lift an active caveat. Ensure the dispute is resolved before proceeding.
                     </p>
                     <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowCaveatForm(false)}>Cancel</button>
                        <button onClick={() => handleRemoveCaveat(getLatestCaveatId())} className="btn btn-primary" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fca5a5" }} disabled={actionLoading}>
                            {actionLoading ? "Awaiting Block..." : "Lift Caveat"}
                        </button>
                     </div>
                </div>
            ) : (
                <form onSubmit={handleAddCaveat}>
                     <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0 16px" }}>
                        <div className="form-group">
                        <label>Caveator (Entity lodging the caveat)</label>
                        <input type="text" className="input-modern" name="placed_by" required placeholder="e.g. High Court of Uganda, or Mortgage Bank" />
                        </div>
                        <div className="form-group">
                        <label>Reason for Caveat</label>
                        <input type="text" className="input-modern" name="reason" required placeholder="e.g. Unpaid Mortgage, Land Dispute, Family Claim" />
                        </div>
                        
                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowCaveatForm(false)}>Abort</button>
                        <button type="submit" className="btn btn-accent" style={{ background: "var(--accent-red)", color: "#fff" }} disabled={actionLoading}>
                            {actionLoading ? "Awaiting Block..." : "Lodge Caveat"}
                        </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
      )}

      {showLeaseForm && (
        <div className="glass-card animate-fade-up" style={{ marginBottom: 40, border: "1px solid rgba(59, 130, 246, 0.4)" }}>
            <h3 style={{ fontFamily: "Space Grotesk", fontSize: "1.2rem", marginBottom: 20, color: "#3B82F6" }}>Register New Property Lease</h3>
            <form onSubmit={handleRegisterLease}>
                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                      <label>Lessee (Tenant) Full Name</label>
                      <input type="text" className="input-modern" name="lessee_name" required placeholder="Name of Person or Company leasing" />
                    </div>
                    <div className="form-group">
                      <label>Lessee National ID</label>
                      <input type="text" className="input-modern" name="lessee_national_id" required placeholder="ID Number" />
                    </div>
                    <div className="form-group">
                      <label>Duration (Months)</label>
                      <input type="number" className="input-modern" name="duration_months" required min="1" placeholder="e.g. 12" />
                    </div>
                    
                    <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 12 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowLeaseForm(false)}>Abort</button>
                    <button type="submit" className="btn btn-accent" style={{ background: "#3B82F6", color: "#fff" }} disabled={actionLoading}>
                        {actionLoading ? "Awaiting Block..." : "Register Lease"}
                    </button>
                    </div>
                </div>
            </form>
        </div>
      )}

      <div className="animate-fade-up delay-2">
        <h2 style={{ fontFamily: "Space Grotesk", fontSize: "1.8rem", marginBottom: 12 }}>Ledger Provenance</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>Immutable cryptographic history of ownership and encumbrances.</p>

        {history.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", color: "var(--text-muted)" }}>No historical blocks found.</div>
        ) : (
          <div className="modern-timeline">
            {history.map((entry, i) => {
              const [blockIndex, timestamp, tx] = entry;
              const isRegister = !!tx.Register;
              const isTransfer = !!tx.Transfer;
              const isInitTransfer = !!tx.InitiateTransfer;
              const isApproveTransfer = !!tx.ApproveTransfer;
              const isCaveat = !!tx.AddCaveat;
              const isRemoveCaveat = !!tx.RemoveCaveat;
              const isRegisterLease = !!tx.RegisterLease;
              const isTerminateLease = !!tx.TerminateLease;

              return (
                <div key={i} className="timeline-event">
                  <div className="timeline-dot" style={{ 
                      background: isCaveat ? "var(--accent-red)" : (isInitTransfer ? "var(--text-muted)" : (isRegisterLease ? "#3B82F6" : ""))
                   }} />
                  <div className="timeline-date">Block Hash Index #{blockIndex} • {formatDate(timestamp)}</div>
                  <div className="timeline-content">
                    {isRegister && (
                      <div>
                        <strong style={{ color: "var(--accent-green)" }}>Genesis Registration</strong><br />
                        Mined by owner <strong style={{ color: "var(--text-main)" }}>{tx.Register?.title.owner_name}</strong>
                      </div>
                    )}
                    {isTransfer && (
                      <div>
                        <strong style={{ color: "var(--accent-gold)" }}>Digital Transfer</strong><br />
                        Provenance transferred from <strong>{tx.Transfer?.from_owner}</strong> to <strong style={{ color: "var(--text-main)" }}>{tx.Transfer?.to_owner}</strong>
                      </div>
                    )}
                    {isInitTransfer && (
                         <div>
                         <strong style={{ color: "var(--text-muted)" }}>Transfer Initiated</strong><br />
                         Transfer initiated to <strong>{tx.InitiateTransfer?.to_owner}</strong>.
                       </div>
                    )}
                    {isApproveTransfer && (
                         <div>
                         <strong style={{ color: "var(--accent-gold)" }}>Transfer Approved</strong><br />
                         Provenance officially accepted by <strong style={{ color: "var(--text-main)" }}>{tx.ApproveTransfer?.new_owner}</strong>.
                       </div>
                    )}
                    {isCaveat && (
                         <div>
                         <strong style={{ color: "var(--accent-red)" }}>Caveat Lodged</strong><br />
                         Placed by: <strong style={{ color: "var(--text-main)" }}>{(tx.AddCaveat as any)?.caveat?.placed_by}</strong><br/>
                         Reason: <span style={{ color: "var(--text-muted)" }}>{(tx.AddCaveat as any)?.caveat?.reason}</span>
                       </div>
                    )}
                    {isRemoveCaveat && (
                         <div>
                         <strong style={{ color: "var(--accent-green)" }}>Caveat Lifted</strong><br />
                         The title has been cleared for transfer.
                       </div>
                    )}
                    {isRegisterLease && (
                         <div>
                         <strong style={{ color: "#3B82F6" }}>Lease Registered</strong><br />
                         Leased to <strong style={{ color: "var(--text-main)" }}>{(tx.RegisterLease as any)?.lease?.lessee_name}</strong> for {(tx.RegisterLease as any)?.lease?.duration_months} months.
                       </div>
                    )}
                    {isTerminateLease && (
                         <div>
                         <strong style={{ color: "var(--text-muted)" }}>Lease Terminated</strong><br />
                         The lease agreement has been terminated and returned to full owner control.
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
