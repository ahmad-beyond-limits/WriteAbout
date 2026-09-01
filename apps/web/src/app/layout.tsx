import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "duoprep | Write & Type",
  description: "Visual writing challenges and precision speed typing tests.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" }
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
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=switzer@200,300,400,500,600,700,800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Onest:wght@200;300;400;500;600;700;800;900&family=Sora:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#f6f8f5] text-[#1b2b20]">{children}</body>
    </html>
  );
}
