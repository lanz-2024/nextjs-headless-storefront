import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/Navigation';
import { CartDrawer } from '@/components/CartDrawer';
import { GTMProvider, GTMNoScript } from '@/lib/gtm/provider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://headless-storefront.example.com';
const gtmId = process.env['NEXT_PUBLIC_GTM_ID'] ?? '';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Headless Storefront — Electronics, Clothing & Accessories',
    template: '%s | Headless Storefront',
  },
  description:
    'Shop the latest electronics, clothing, and accessories. Fast shipping, easy returns, and WCAG AA accessible.',
  keywords: ['ecommerce', 'electronics', 'clothing', 'accessories', 'headless storefront'],
  authors: [{ name: 'Headless Storefront' }],
  creator: 'Headless Storefront',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Headless Storefront',
    title: 'Headless Storefront — Electronics, Clothing & Accessories',
    description:
      'Shop the latest electronics, clothing, and accessories with fast shipping and easy returns.',
    images: [
      {
        url: `${siteUrl}/og-default.jpg`,
        width: 1200,
        height: 630,
        alt: 'Headless Storefront',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Headless Storefront',
    description: 'Shop electronics, clothing, and accessories.',
    images: [`${siteUrl}/og-default.jpg`],
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
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-white text-gray-900 antialiased">
        {/* GTM noscript — must be first child of body */}
        <GTMNoScript gtmId={gtmId} />
        <GTMProvider gtmId={gtmId} />

        {/* Skip to content — WCAG 2.4.1 */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <Navigation />

        <main id="main-content" tabIndex={-1}>
          {children}
        </main>

        <footer className="mt-auto border-t border-gray-200 py-12">
          <div className="container-page">
            <div className="flex flex-col md:flex-row justify-between gap-8">
              <div>
                <p className="font-semibold text-gray-900">Headless Storefront</p>
                <p className="mt-2 text-sm text-gray-500">
                  A Next.js headless e-commerce demo with WooCommerce + Shopify adapter pattern.
                </p>
              </div>
              <nav aria-label="Footer navigation">
                <ul className="flex flex-wrap gap-6 text-sm text-gray-600">
                  <li>
                    <a href="/products" className="hover:text-gray-900 transition-colors">
                      Products
                    </a>
                  </li>
                  <li>
                    <a href="/search" className="hover:text-gray-900 transition-colors">
                      Search
                    </a>
                  </li>
                  <li>
                    <a href="/cart" className="hover:text-gray-900 transition-colors">
                      Cart
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
            <p className="mt-8 text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Headless Storefront. MIT License.
            </p>
          </div>
        </footer>

        <CartDrawer />
      </body>
    </html>
  );
}
