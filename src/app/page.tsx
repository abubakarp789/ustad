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
      {/* Background Elements */}
      <div className="landing-bg-gradient" />
      <div className="landing-grid-overlay" />
      <div className="landing-noise" />

      {/* 1. Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="logo-icon-new">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 6 14 12 8 18"></polyline>
              <line x1="14" y1="18" x2="20" y2="18"></line>
            </svg>
          </div>
          <span className="logo-text-glitch" data-text="USTAD">USTAD</span>
        </div>
        <div className="landing-nav-actions">
          <Link href="https://github.com/abubakarp789/ustad" target="_blank" rel="noopener noreferrer" className="btn btn-icon btn-ghost" title="GitHub Repository">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6a5.5 5.5 0 0 0-1.5-3.8 5.5 5.5 0 0 0-.1-3.8s-1.2-.4-3.9 1.4a13.3 13.3 0 0 0-7 0c-2.7-1.8-3.9-1.4-3.9-1.4a5.5 5.5 0 0 0-.1 3.8A5.5 5.5 0 0 0 2 13c0 4.5 3 5.7 6 6a4.8 4.8 0 0 0-1 3.2v4"></path></svg>
          </Link>
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
              Launch App <span className="arrow">→</span>
            </Link>
            <div className="user-button-container">
              <UserButton />
            </div>
          </SignedIn>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="landing-hero animate-fade-in-up">
        <div className="landing-badge pulse-glow">
          <span className="badge-dot"></span>
          Terminal Luxe Edition
        </div>
        <h1 className="landing-title">
          <span className="typewriter">Master Cloud Labs</span><br />
          <span className="text-muted">Without the Friction.</span>
        </h1>
        <p className="landing-subtitle">
          Paste the content of any Google Cloud Skills Boost lab. Our AI generates the exact commands, explains the concepts, and gives you a trackable checklist. Execute faster, learn deeper.
        </p>
        <div className="landing-cta-group">
          <SignedOut>
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="btn btn-primary btn-lg shine-effect">
                Start Solving Labs <span className="arrow">→</span>
              </button>
            </SignUpButton>
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button className="btn btn-secondary btn-lg">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn btn-primary btn-lg shine-effect">
              Open Dashboard <span className="arrow">→</span>
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* 3. Social Proof */}
      <section className="landing-social-proof animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <p className="social-proof-text">POWERED BY NEXT-GENERATION TECH</p>
        <div className="social-proof-logos">
          <div className="logo-item flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <span className="font-mono text-sm tracking-wider">Next.js 15</span>
          </div>
          <div className="logo-item flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span className="font-mono text-sm tracking-wider">Gemini AI</span>
          </div>
          <div className="logo-item flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
            <span className="font-mono text-sm tracking-wider">Google Cloud</span>
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section className="landing-how-it-works">
        <div className="section-header center">
          <h2 className="section-title">Workflow Redefined.</h2>
          <p className="section-subtitle">From a lab URL to a completed assignment in three steps.</p>
        </div>

        <div className="steps-container">
          <div className="step-item relative">
            <div className="step-number">01</div>
            <div className="step-content">
              <h3 className="feature-title">Paste the Content</h3>
              <p className="feature-desc">Paste the content of any Google Cloud Skills Boost lab into the terminal. We parse the structure automatically.</p>
            </div>
            <div className="step-connector"></div>
          </div>
          <div className="step-item relative">
            <div className="step-number">02</div>
            <div className="step-content">
              <h3 className="feature-title">AI Generation</h3>
              <p className="feature-desc">Gemini analyzes the objectives and generates the exact gcloud commands needed to crack the lab.</p>
            </div>
            <div className="step-connector"></div>
          </div>
          <div className="step-item">
            <div className="step-number">03</div>
            <div className="step-content">
              <h3 className="feature-title">Track & Execute</h3>
              <p className="feature-desc">Follow the interactive checklist, copy commands with one click, and watch your progress bar fill.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section className="landing-features-grid">
        <div className="glass-card feature-card">
          <div className="feature-icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          </div>
          <h3 className="feature-title border-bottom-small pb-2 mb-2">Universal Lab Support</h3>
          <p className="feature-desc">
            Works across the entire Google Cloud Skills Boost catalog, from introductory labs to advanced architecture quests.
          </p>
        </div>

        <div className="glass-card feature-card">
          <div className="feature-icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
          </div>
          <h3 className="feature-title border-bottom-small pb-2 mb-2">Precise Commands</h3>
          <p className="feature-desc">
            Stop guessing flags. Get accurate gcloud, kubectl, and bq commands instantly runnable in Cloud Shell.
          </p>
        </div>

        <div className="glass-card feature-card">
          <div className="feature-icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h3 className="feature-title border-bottom-small pb-2 mb-2">Progress Tracking</h3>
          <p className="feature-desc">
            Persistent checklist tied to your account. Leave a lab half-done and return exactly where you left off.
          </p>
        </div>

        <div className="glass-card feature-card">
          <div className="feature-icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3 className="feature-title border-bottom-small pb-2 mb-2">Markdown Export</h3>
          <p className="feature-desc">
            Export your generated solutions to clean Markdown. Perfect for building your personal knowledge base.
          </p>
        </div>

        <div className="glass-card feature-card">
          <div className="feature-icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </div>
          <h3 className="feature-title border-bottom-small pb-2 mb-2">Concept Explanations</h3>
          <p className="feature-desc">
            Don't just copy-paste. Read brief, AI-powered explanations for why a specific command solves the objective.
          </p>
        </div>

        <div className="glass-card feature-card">
          <div className="feature-icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h3 className="feature-title border-bottom-small pb-2 mb-2">Secure & Private</h3>
          <p className="feature-desc">
            Your lab history and progress are secured using Clerk authentication and isolated in your own workspace.
          </p>
        </div>
      </section>



      {/* 7. Bottom CTA */}
      <section className="landing-bottom-cta">
        <div className="glow-backdrop"></div>
        <div className="relative z-10">
          <h2 className="section-title text-center text-4xl mb-4">Ready to level up?</h2>
          <p className="section-subtitle text-center mb-8">Join developers solving labs faster with Ustad.</p>
          <div className="flex justify-center flex-wrap gap-4">
            <SignedOut>
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="btn btn-primary btn-lg shine-effect">
                  Create Free Account <span className="arrow">→</span>
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" className="btn btn-primary btn-lg shine-effect">
                Go to Dashboard <span className="arrow">→</span>
              </Link>
            </SignedIn>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="landing-footer border-t border-white/10 mt-12 py-8 px-6 max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between opacity-80" style={{ borderTop: "1px solid var(--border-subtle)", marginTop: "80px", paddingTop: "32px", paddingBottom: "32px", maxWidth: "1200px", margin: "80px auto 0", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
        <div className="footer-logo flex items-center gap-2 font-display uppercase tracking-wider text-sm font-bold" style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          <div className="logo-icon-new" style={{ width: "24px", height: "24px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8 6 14 12 8 18"></polyline>
              <line x1="14" y1="18" x2="20" y2="18"></line>
            </svg>
          </div>
          <span className="logo-text-glitch" data-text="USTAD" style={{ fontSize: "1rem" }}>USTAD</span>
        </div>
        <p className="footer-copyright text-sm text-white/50 text-center" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textAlign: "center" }}>
          Built for Vibe Code till Sehri by <Link href="https://www.linkedin.com/in/abubakar56/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary)", textDecoration: "underline" }}>Abu Bakar</Link>
        </p>
        <div className="footer-links flex gap-6 text-sm text-white/70" style={{ display: "flex", gap: "24px", fontSize: "0.9rem" }}>
          <Link href="https://github.com/abubakarp789/ustad" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" style={{ color: "var(--text-secondary)", transition: "color var(--transition-fast)" }}>GitHub</Link>
          <Link href="https://www.linkedin.com/in/abubakar56/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors" style={{ color: "var(--text-secondary)", transition: "color var(--transition-fast)" }}>LinkedIn</Link>
        </div>
      </footer>
    </div>
  );
}
