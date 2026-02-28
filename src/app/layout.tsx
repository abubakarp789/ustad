import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lab Buddy — Your Cloud Lab Companion",
  description:
    "Paste a Google Cloud Skills Boost lab URL and get an interactive checklist with AI-generated solutions, commands, and progress tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#38bdf8",
          colorBackground: "#111827",
          colorInputBackground: "#0a0e17",
          colorText: "#f1f5f9",
          borderRadius: "12px",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        },
        elements: {
          card: {
            backgroundColor: "#111827",
            borderColor: "rgba(56, 189, 248, 0.15)",
          },
          headerTitle: { color: "#f1f5f9" },
          headerSubtitle: { color: "#94a3b8" },
          socialButtonsBlockButton: {
            backgroundColor: "#0a0e17",
            borderColor: "rgba(56, 189, 248, 0.15)",
            color: "#f1f5f9",
          },
          formFieldInput: {
            backgroundColor: "#0a0e17",
            borderColor: "rgba(56, 189, 248, 0.15)",
            color: "#f1f5f9",
          },
          footerActionLink: { color: "#38bdf8" },
        },
      }}
    >
      <html lang="en">
        <body suppressHydrationWarning>{children}</body>
      </html>
    </ClerkProvider>
  );
}
