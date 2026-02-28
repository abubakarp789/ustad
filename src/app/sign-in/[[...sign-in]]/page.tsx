import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="auth-page">
            <div className="auth-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem', fontWeight: 600, justifyContent: 'center', marginBottom: '1.5rem' }}>
                <img src="/logo.png" width={28} height={28} alt="Ustad Logo" style={{ borderRadius: '6px' }} />
                Ustad
            </div>
            <SignIn
                routing="path"
                path="/sign-in"
                signUpUrl="/sign-up"
                fallbackRedirectUrl="/dashboard"
            />
        </div>
    );
}
