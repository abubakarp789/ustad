import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="auth-page">
            <div className="auth-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem', fontWeight: 600, justifyContent: 'center', marginBottom: '1.5rem' }}>
                <img src="/logo.png" width={28} height={28} alt="Ustad Logo" style={{ borderRadius: '6px' }} />
                Ustad
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
