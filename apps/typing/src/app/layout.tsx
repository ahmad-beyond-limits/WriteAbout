import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { SettingsProvider } from "@/lib/SettingsContext";

export const metadata: Metadata = {
  title: "SwiftType | Minimalist Speed Typing Test",
  description: "A fast, modern, and distraction-free typing test application powered by Neon PostgreSQL.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-screen max-h-screen overflow-hidden">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Onest:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="h-screen max-h-screen overflow-hidden flex flex-col justify-center items-center antialiased select-none p-0 m-0">
        <AuthProvider>
          <SettingsProvider>
            <main className="w-full h-full flex flex-col justify-center items-center overflow-hidden p-0 m-0">
              {children}
            </main>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
