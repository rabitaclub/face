import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppConfig from "@/config/app.config.json";
import AppShell from "@/components/AppShell";
import "./globals.css";
import Providers from "./providers";

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
  description: AppConfig.description,
  keywords: AppConfig.keywords,
  authors: AppConfig.authors,
  creator: AppConfig.creator,
  
  // openGraph: {
  //   type: "website",
  //   locale: "en_US",
  //   url: "https://your-domain.com",
  //   siteName: name,
  //   title: name,
  //   description: description,
  //   images: [
  //     {
  //       url: "https://your-domain.com/og-image.jpg",
  //       width: 1200,
  //       height: 630,
  //       alt: name,
  //     },
  //   ],
  // },
  
  twitter: {
    card: "summary_large_image",
    title: AppConfig.name,
    description: AppConfig.description,
    images: ["https://rabita.club/x-image.jpg"],
    creator: "@rabitaclub",
  },
  
  icons: {
    icon: [
      { url: "/favicon.ico" }
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  applicationName: AppConfig.name,
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
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
