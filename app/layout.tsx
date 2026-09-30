import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { OnlineCountProvider } from "@/lib/presence";
import GlobalErrorListener from "@/components/GlobalErrorListener";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "decyde — Fast, Fun Group Decisions",
  description: "Create real-time decision rooms, vote with Yes, Meh, or No, and decide together effortlessly.",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalErrorListener />
        <OnlineCountProvider>{children}</OnlineCountProvider>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
