import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AppConfig from "@/config/app.config.json";
import AppShell from "@/components/AppShell";
import "./globals.css";
import Providers from "./providers";
import { ToastContainer } from "@/components/ui/ToastContainer";
import Script from "next/script";

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
    template: AppConfig.seo?.titleTemplate || `%s | ${AppConfig.name}`,
    default: AppConfig.seo?.defaultTitle || `${AppConfig.name} | ${AppConfig.description}`,
  },
  description: AppConfig.seoDescription || AppConfig.longDescription || AppConfig.description,
  keywords: AppConfig.keywords,
  authors: AppConfig.authors,
  creator: AppConfig.creator,
  
  openGraph: {
    type: "website",
    locale: AppConfig.locale,
    url: AppConfig.url,
    siteName: AppConfig.name,
    title: AppConfig.name,
    description: AppConfig.seoDescription || AppConfig.longDescription || AppConfig.description,
    images: [
      {
        url: `${AppConfig.url}${AppConfig.images.background}`,
        width: 1200,
        height: 630,
        alt: AppConfig.name,
      },
    ],
  },
  
  twitter: {
    card: "summary_large_image",
    title: `${AppConfig.name} - ${AppConfig.description}`,
    description: AppConfig.seoDescription || AppConfig.longDescription || AppConfig.description,
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
    nocache: false,
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
    languages: AppConfig.seo?.alternateLocales?.reduce((acc, locale) => {
      acc[locale] = `/${locale}`;
      return acc;
    }, {} as Record<string, string>) || {
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
  referrer: 'origin-when-cross-origin',
  themeColor: AppConfig.colors?.primary || '#3B82F6',
  colorScheme: 'dark light',
  formatDetection: {
    telephone: true,
    date: true,
    address: true,
    email: true,
    url: true,
  },
};

// Generate structured data JSON-LD for the organization
const structuredData = AppConfig.seo?.structured ? {
  '@context': 'https://schema.org',
  ...AppConfig.seo.structured
} : {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: AppConfig.name,
  url: AppConfig.url,
  logo: `${AppConfig.url}${AppConfig.images.logo}`,
  sameAs: Object.values(AppConfig.socials || {})
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={AppConfig.locale?.split('-')[0] || "en"}>
      <head>
        <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
        <meta name="theme-color" content={AppConfig.colors?.primary || '#3B82F6'} />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href={AppConfig.url} />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <ToastContainer />
          <AppShell>{children}</AppShell>
        </Providers>
        
        {/* Analytics Script - Only add if ID exists */}
        {AppConfig.seo?.googleAnalyticsId && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${AppConfig.seo.googleAnalyticsId}`}
            />
            <Script
              id="google-analytics"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${AppConfig.seo.googleAnalyticsId}', {
                    page_path: window.location.pathname,
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
