import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export default function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-bg" />
      <div className="landing-grid" />

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <img src="/logo.png" width={24} height={24} alt="Ustad Logo" className="landing-logo-icon" style={{ borderRadius: '4px' }} />
          Ustad
        </div>
        <div className="landing-nav-actions">
          <SignedOut>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="btn btn-ghost">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="btn btn-primary">Get Started</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn btn-primary">
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-badge">Built with AI at GDG Pakistan</div>
        <h1 className="landing-title">
          Your Cloud Labs,<br />
          <span style={{ opacity: 0.7 }}>Solved & Tracked</span>
        </h1>
        <p className="landing-subtitle">
          Paste any Google Cloud Skills Boost lab URL and get an interactive
          checklist with AI-generated solutions, real commands, and progress
          tracking — all in one beautiful dashboard.
        </p>
        <div className="landing-cta-group">
          <SignedOut>
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="btn btn-primary">
                → Start Solving Labs
              </button>
            </SignUpButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="btn btn-secondary">
                Already have an account?
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn btn-primary">
              → Go to Dashboard
            </Link>
          </SignedIn>
        </div>

        {/* --- EVENT BANNER --- */}
        <div className="event-banner glass-card" style={{ marginTop: "3rem", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border)", background: "linear-gradient(145deg, rgba(20,20,20,0.8) 0%, rgba(5,5,5,0.9) 100%)", position: "relative", overflow: "hidden", textAlign: "left", maxWidth: "800px", marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "4px", background: "linear-gradient(90deg, #ffbd2e, #ff5f56, #27c93f)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600, color: "#fff" }}>GDG Live Pakistan</span>
                <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>• Ramzan Special</span>
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 10px 0", color: "#fff" }}>Built for Vibe Code till Sehri</h2>
              <p style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "0" }}>
                I built this system and named it <strong>Ustad</strong> specifically for the <strong>Vibe Code till Sehri</strong> event hosted by GDG Live Pakistan this Ramzan. Let's write some code and enjoy the vibes rather than dealing with boilerplate!
              </p>
            </div>
            <div>
              <a href="https://gdg.community.dev/events/details/google-gdg-live-pakistan-presents-vibe-code-till-sehri/" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: "10px 24px", fontWeight: 600, fontSize: "0.95rem", boxShadow: "0 0 20px rgba(255,255,255,0.1)", textDecoration: "none", display: "inline-block" }}>
                Get Ticket
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="glass-card feature-card">
          <div className="feature-icon">🔗</div>
          <h3 className="feature-title">Paste Lab URL</h3>
          <p className="feature-desc">
            Drop any Google Cloud Skills Boost lab link. We scrape the tasks,
            objectives, and structure automatically.
          </p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-icon">⚙️</div>
          <h3 className="feature-title">AI-Powered Solutions</h3>
          <p className="feature-desc">
            Gemini AI generates step-by-step solutions with actual gcloud
            commands, explanations, and pro tips.
          </p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-icon">✓</div>
          <h3 className="feature-title">Interactive Checklist</h3>
          <p className="feature-desc">
            Track your progress with checkmarks, copy commands instantly, and
            export everything to Markdown.
          </p>
        </div>
      </section>
    </div>
  );
}
