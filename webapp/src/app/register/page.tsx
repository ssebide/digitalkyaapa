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
      setError(
        "Unable to connect to the blockchain server. Please ensure the Rust backend is running on port 8080."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="register-section">
      <div className="register-header">
        <h1>
          Register Land <span style={{ color: "var(--gold)" }}>Title</span>
        </h1>
        <p>Record your land ownership on the blockchain for permanent, tamper-proof protection</p>
      </div>

      {success && (
        <div className="success-banner">
          ✅ Title <strong>{success.title_id}</strong> registered successfully on the blockchain!
          <br />
          <span style={{ fontSize: "0.9rem", opacity: 0.85 }}>
            Owner: {success.owner_name} | District: {success.district} | Plot: {success.plot_number}
          </span>
          <div style={{ marginTop: 12 }}>
            <a
              href={`/titles/${success.title_id}`}
              className="btn btn-green"
              style={{ fontSize: "0.85rem", padding: "8px 20px" }}
            >
              View Title →
            </a>
          </div>
        </div>
      )}

      {error && <div className="error-banner">❌ {error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: 32 }}>
        <div className="form-grid">
          {/* Owner Information */}
          <div className="form-section-title">👤 Owner Information</div>

          <div className="input-group">
            <label htmlFor="owner_name">Full Name</label>
            <input
              type="text"
              className="input"
              id="owner_name"
              name="owner_name"
              placeholder="e.g. John Mukasa Ssempijja"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="national_id">National ID Number</label>
            <input
              type="text"
              className="input"
              id="national_id"
              name="national_id"
              placeholder="e.g. CM1234567890AB"
              required
            />
          </div>

          {/* Location Information */}
          <div className="form-section-title">📍 Land Location</div>

          <div className="input-group">
            <label htmlFor="district">District</label>
            <select className="input" id="district" name="district" required>
              <option value="">Select District</option>
              {UGANDA_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="county">County</label>
            <input
              type="text"
              className="input"
              id="county"
              name="county"
              placeholder="e.g. Busiro"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="sub_county">Sub County</label>
            <input
              type="text"
              className="input"
              id="sub_county"
              name="sub_county"
              placeholder="e.g. Nangabo"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="parish">Parish</label>
            <input
              type="text"
              className="input"
              id="parish"
              name="parish"
              placeholder="e.g. Gayaza"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="village">Village</label>
            <input
              type="text"
              className="input"
              id="village"
              name="village"
              placeholder="e.g. Kayebe"
              required
            />
          </div>

          {/* Land Details */}
          <div className="form-section-title">🏘️ Land Details</div>

          <div className="input-group">
            <label htmlFor="plot_number">Plot / Block Number</label>
            <input
              type="text"
              className="input"
              id="plot_number"
              name="plot_number"
              placeholder="e.g. Block 123 Plot 45"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="size_acres">Size (Acres)</label>
            <input
              type="number"
              className="input"
              id="size_acres"
              name="size_acres"
              placeholder="e.g. 2.5"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          <div className="input-group full-width">
            <label htmlFor="coordinates">GPS Coordinates (Optional)</label>
            <input
              type="text"
              className="input"
              id="coordinates"
              name="coordinates"
              placeholder="e.g. 0.3476° N, 32.5825° E"
            />
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              id="register-button"
              disabled={loading}
            >
              {loading ? "⛏️ Mining Block..." : "⛓️ Register on Blockchain"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
