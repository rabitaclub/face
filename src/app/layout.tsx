import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppConfig from "@/config/app.config.json";
import AppShell from "@/components/AppShell";
import "./globals.css";
import Providers from "./providers";
import { ToastContainer } from "@/components/ui/ToastContainer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: `%s | ${AppConfig.name}`,
    default: `${AppConfig.name} | ${AppConfig.description}`,
  },
  description: AppConfig.longDescription || AppConfig.description,
  keywords: AppConfig.keywords,
  authors: AppConfig.authors,
  creator: AppConfig.creator,
  
  openGraph: {
    type: "website",
    locale: AppConfig.locale,
    url: AppConfig.url,
    siteName: AppConfig.name,
    title: AppConfig.name,
    description: AppConfig.longDescription || AppConfig.description,
    images: [
      {
        url: `${AppConfig.url}${AppConfig.images.og}`,
        width: 1200,
        height: 630,
        alt: AppConfig.name,
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: `${AppConfig.name} - ${AppConfig.description}`,
    description: AppConfig.longDescription || AppConfig.description,
    images: [`${AppConfig.url}${AppConfig.images.twitter}`],
    creator: "@rabitaclub",
    site: "@rabitaclub",
  },
  
  icons: {
    icon: [
      { url: AppConfig.images.favicon },
      { url: AppConfig.images.icon, type: "image/png" }
    ],
    apple: [
      { url: AppConfig.images.appleIcon, sizes: "180x180", type: "image/png" },
    ],
    shortcut: [{ url: AppConfig.images.icon }],
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  applicationName: AppConfig.name,
  metadataBase: new URL(AppConfig.url),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    google: 'google-site-verification-code', // Replace with actual code when available
  },
  category: 'technology',
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
        <Providers>
          <ToastContainer />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
