import type { Metadata, Viewport } from "next";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import { LIVE_URL } from "@/lib/config";
import "./globals.css";
import "./weather.css";

const description =
  "Today, 7-day and 30-day weather with animated skies, hourly details, ten colour schemes, eight animated icon sets and seven data providers.";

export const metadata: Metadata = {
  metadataBase: new URL(LIVE_URL),
  title: {
    default: "Pohoda — weather, clearly",
    template: "%s · Pohoda",
  },
  description,
  applicationName: "Pohoda",
  manifest: "/manifest.webmanifest",
  keywords: [
    "weather",
    "forecast",
    "hourly forecast",
    "30-day forecast",
    "weather app",
    "open-meteo",
  ],
  authors: [{ name: "Sokolyanskyi", url: "https://github.com/Sokolyanskyi" }],
  openGraph: {
    type: "website",
    url: LIVE_URL,
    siteName: "Pohoda",
    title: "Pohoda — weather, clearly",
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pohoda — weather, clearly",
    description,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Pohoda",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef3fa" },
    { media: "(prefers-color-scheme: dark)", color: "#070c18" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
