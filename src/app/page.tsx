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
          <div className="landing-logo-icon">🧪</div>
          Lab Buddy
        </div>
        <div className="landing-nav-actions">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-ghost">Sign In</button>
            </SignInButton>
            <SignUpButton mode="modal">
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
        <div className="landing-badge">⚡ Built with AI at GDG Pakistan</div>
        <h1 className="landing-title">
          Your Cloud Labs,{" "}
          <span className="landing-title-gradient">Solved & Tracked</span>
        </h1>
        <p className="landing-subtitle">
          Paste any Google Cloud Skills Boost lab URL and get an interactive
          checklist with AI-generated solutions, real commands, and progress
          tracking — all in one beautiful dashboard.
        </p>
        <div className="landing-cta-group">
          <SignedOut>
            <SignUpButton mode="modal">
              <button className="btn btn-primary">
                🚀 Start Solving Labs
              </button>
            </SignUpButton>
            <SignInButton mode="modal">
              <button className="btn btn-secondary">
                Already have an account?
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="btn btn-primary">
              🚀 Go to Dashboard
            </Link>
          </SignedIn>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="glass-card feature-card">
          <div className="feature-icon feature-icon-blue">🔗</div>
          <h3 className="feature-title">Paste Lab URL</h3>
          <p className="feature-desc">
            Drop any Google Cloud Skills Boost lab link. We scrape the tasks,
            objectives, and structure automatically.
          </p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-icon feature-icon-purple">🤖</div>
          <h3 className="feature-title">AI-Powered Solutions</h3>
          <p className="feature-desc">
            Gemini AI generates step-by-step solutions with actual gcloud
            commands, explanations, and pro tips.
          </p>
        </div>
        <div className="glass-card feature-card">
          <div className="feature-icon feature-icon-green">✅</div>
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
