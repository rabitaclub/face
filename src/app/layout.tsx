import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppConfig from "@/config/app.config.json";
import AppShell from "@/components/AppShell";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from 'react-hot-toast';

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
          <Toaster 
            position="top-right"
            toastOptions={{
              style: {
                background: '#ffffff',
                color: '#0f172a',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                borderRadius: '0.5rem',
                padding: '0.75rem 1rem',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
