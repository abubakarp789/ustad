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
          colorPrimary: "#ffffff",
          colorBackground: "#050505",
          colorInputBackground: "#0a0a0a",
          colorText: "#ffffff",
          borderRadius: "8px",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        },
        elements: {
          card: {
            backgroundColor: "#050505",
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          headerTitle: { color: "#ffffff" },
          headerSubtitle: { color: "#a3a3a3" },
          socialButtonsBlockButton: {
            backgroundColor: "#0a0a0a",
            borderColor: "rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
          },
          formFieldInput: {
            backgroundColor: "#0a0a0a",
            borderColor: "rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
          },
          footerActionLink: { color: "#ffffff" },
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>{children}</body>
      </html>
    </ClerkProvider>
  );
}
