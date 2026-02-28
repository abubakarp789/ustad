import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="auth-page">
            <div className="landing-bg" />
            <div className="auth-logo">
                <div className="landing-logo-icon">🧪</div>
                Lab Buddy
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
