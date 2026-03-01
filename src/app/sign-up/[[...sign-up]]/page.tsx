import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="auth-page">
            <div className="auth-logo landing-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', marginBottom: '40px' }}>
                <div className="logo-icon-new">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="8 6 14 12 8 18"></polyline>
                        <line x1="14" y1="18" x2="20" y2="18"></line>
                    </svg>
                </div>
                <span className="logo-text-glitch" data-text="USTAD" style={{ fontSize: '1.8rem' }}>USTAD</span>
            </div>
            <SignUp
                routing="path"
                path="/sign-up"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/dashboard"
            />
        </div>
    );
}
