"use client";

import { useState } from "react";

const UGANDA_DISTRICTS = [
  "Kampala", "Wakiso", "Mukono", "Jinja", "Mbale", "Mbarara", "Gulu", "Lira",
  "Soroti", "Arua", "Fort Portal", "Masaka", "Entebbe", "Hoima", "Kasese",
  "Kabale", "Mityana", "Iganga", "Tororo", "Busia", "Pallisa", "Kamuli",
  "Luwero", "Mpigi", "Rakai", "Masindi", "Kiboga", "Mubende", "Kayunga",
  "Nakasongola", "Apac", "Kotido", "Moroto", "Kapchorwa", "Bugiri", "Mayuge",
  "Sironko", "Manafwa", "Bududa", "Butaleja", "Kaliro", "Namutumba",
  "Bukedea", "Kumi", "Ngora", "Serere", "Kaberamaido", "Amolatar",
  "Dokolo", "Alebtong", "Otuke", "Kole", "Oyam", "Pader", "Kitgum",
  "Lamwo", "Agago", "Nwoya", "Amuru", "Adjumani", "Moyo", "Yumbe",
  "Koboko", "Maracha", "Zombo", "Nebbi", "Pakwach", "Buliisa", "Kiryandongo",
  "Kyankwanzi", "Gomba", "Butambala", "Kalungu", "Lwengo", "Bukomansimbi",
  "Lyantonde", "Sembabule", "Kiruhura", "Isingiro", "Ntungamo", "Rukungiri",
  "Kanungu", "Kisoro", "Rubanda", "Rukiga", "Sheema", "Bushenyi",
  "Mitooma", "Rubirizi", "Buhweju", "Kyegegwa", "Kyenjojo", "Kabarole",
  "Kamwenge", "Kitagwenda", "Bundibugyo", "Ntoroko"
].sort();

interface RegisteredTitle {
  title_id: string;
  owner_name: string;
  district: string;
  plot_number: string;
}

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<RegisteredTitle | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const body = {
      owner_name: formData.get("owner_name") as string,
      national_id: formData.get("national_id") as string,
      district: formData.get("district") as string,
      county: formData.get("county") as string,
      sub_county: formData.get("sub_county") as string,
      parish: formData.get("parish") as string,
      village: formData.get("village") as string,
      plot_number: formData.get("plot_number") as string,
      size_acres: parseFloat(formData.get("size_acres") as string),
      coordinates: (formData.get("coordinates") as string) || null,
      zoning: formData.get("zoning") as string,
    };

    try {
      const res = await fetch("/api/titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess({
          title_id: data.data.title_id,
          owner_name: data.data.owner_name,
          district: data.data.district,
          plot_number: data.data.plot_number,
        });
        (e.target as HTMLFormElement).reset();
      } else {
        setError(data.message || "Registration failed");
      }
    } catch {
      setError("Unable to connect to the blockchain server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: 120 }}>
      {/* Background glow specific to registration */}
      <div className="hero-glow" style={{ background: "radial-gradient(circle at center, rgba(46, 204, 113, 0.1) 0%, transparent 60%)" }}></div>
      
      <section className="form-container animate-fade-up">
        <div className="page-header">
          <h1>Issue New Title</h1>
          <p>Commit immutable ownership data to the cryptographic ledger.</p>
        </div>

        {success && (
          <div className="banner banner-success animate-fade-up">
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "Space Grotesk", fontSize: "1.1rem", marginBottom: 4 }}>
                Successfully Mined Block
              </div>
              <div style={{ opacity: 0.8, fontSize: "0.85rem" }}>
                Title <strong>{success.title_id}</strong> registered for {success.owner_name}
              </div>
            </div>
            <a href={`/titles/${success.title_id}`} className="btn btn-primary" style={{ height: 36, fontSize: "0.85rem" }}>
              View Title
            </a>
          </div>
        )}

        {error && <div className="banner banner-error animate-fade-up">{error}</div>}

        <form onSubmit={handleSubmit} className="glass-card animate-fade-up delay-1">
          {/* Identity block */}
          <h3 style={{ fontFamily: "Space Grotesk", fontSize: "1.2rem", marginBottom: 24, paddingBottom: 12, borderBottom: "1px dashed var(--border-light)" }}>
            01. Personal Identity
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <div className="form-group">
              <label>Legal Full Name</label>
              <input type="text" name="owner_name" className="input-modern" required placeholder="John Mukasa Ssempijja" />
            </div>
            <div className="form-group">
              <label>National ID No.</label>
              <input type="text" name="national_id" className="input-modern" required placeholder="CM1234..." />
            </div>
          </div>

          <h3 style={{ fontFamily: "Space Grotesk", fontSize: "1.2rem", margin: "32px 0 24px", paddingBottom: 12, borderBottom: "1px dashed var(--border-light)" }}>
            02. Geographic Location
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <div className="form-group">
              <label>District</label>
              <select name="district" className="input-modern" required style={{ appearance: "none" }}>
                <option value="">Select District</option>
                {UGANDA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>County</label>
              <input type="text" name="county" className="input-modern" required />
            </div>
            <div className="form-group">
              <label>Sub County</label>
              <input type="text" name="sub_county" className="input-modern" required />
            </div>
            <div className="form-group">
              <label>Parish</label>
              <input type="text" name="parish" className="input-modern" required />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Village</label>
              <input type="text" name="village" className="input-modern" required />
            </div>
          </div>

          <h3 style={{ fontFamily: "Space Grotesk", fontSize: "1.2rem", margin: "32px 0 24px", paddingBottom: 12, borderBottom: "1px dashed var(--border-light)" }}>
            03. Property Specifications
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Plot / Block Reference</label>
              <input type="text" name="plot_number" className="input-modern" required placeholder="Block 123 Plot 45" />
            </div>
            <div className="form-group">
              <label>Acreage</label>
              <input type="number" name="size_acres" className="input-modern" step="0.01" min="0.01" required placeholder="2.5" />
            </div>
            <div className="form-group">
              <label>Zoning Type</label>
              <select name="zoning" className="input-modern" required style={{ appearance: "none" }}>
                <option value="">Select Zoning</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Industrial">Industrial</option>
                <option value="MixedUse">Mixed Use</option>
                <option value="Unzoned">Unzoned</option>
              </select>
            </div>
            <div className="form-group">
              <label>GPS Coordinates</label>
              <input type="text" name="coordinates" className="input-modern" placeholder="0.3476° N, 32.5825° E" />
            </div>
          </div>

          <div style={{ marginTop: 40, textAlign: "right" }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Writing to Blockchain..." : "Hash & Register Protocol"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
