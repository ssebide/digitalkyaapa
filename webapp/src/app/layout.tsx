import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigitalKyapa | Uganda Land Registry",
  description:
    "Secure, transparent, and immutable digital land title registry for Uganda. Verify land ownership and prevent land wrangles using blockchain technology.",
  keywords: [
    "Uganda",
    "land titles",
    "blockchain",
    "digital registry",
    "land ownership",
  ],
};

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <a href="/" className="nav-brand">
          <div className="nav-brand-icon">DK</div>
          DigitalKyapa
        </a>
        <ul className="nav-links">
          <li>
            <a href="/">Overview</a>
          </li>
          <li>
            <a href="/search">Verify</a>
          </li>
          <li>
            <a href="/register">Register</a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-brand">DigitalKyapa</div>
        <div className="footer-copy">
          © 2026 Securing Uganda&apos;s Land Rights. Built on Blockchain.
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
