import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigitalKyapa - Uganda Land Title Blockchain",
  description:
    "Secure, transparent, and immutable digital land title registry for Uganda. Verify land ownership and prevent land wrangles using blockchain technology.",
  keywords: [
    "Uganda",
    "land titles",
    "blockchain",
    "digital registry",
    "land ownership",
    "DigitalKyapa",
  ],
};

function Navbar() {
  return (
    <nav className="navbar">
      <a href="/" className="navbar-logo">
        <div className="navbar-logo-icon">DK</div>
        <div className="navbar-logo-text">
          Digital<span>Kyapa</span>
        </div>
      </a>
      <ul className="navbar-links">
        <li>
          <a href="/">Home</a>
        </li>
        <li>
          <a href="/search">Search Titles</a>
        </li>
        <li>
          <a href="/register">Register Title</a>
        </li>
        <li>
          <a href="/search" className="btn btn-primary" style={{ padding: "10px 22px", fontSize: "0.88rem" }}>
            Verify Title
          </a>
        </li>
      </ul>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-text">
          © 2026 <span>DigitalKyapa</span> — Securing Uganda&apos;s Land Rights
        </div>
        <div className="footer-flag">
          <div className="f-black"></div>
          <div className="f-gold"></div>
          <div className="f-red"></div>
          <div className="f-black"></div>
          <div className="f-gold"></div>
          <div className="f-red"></div>
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="page-wrapper">
          <Navbar />
          <main className="main-content">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
