import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="auth-page">
            <div className="landing-bg" />
            <div className="auth-logo">
                <div className="landing-logo-icon">🧪</div>
                Lab Buddy
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
