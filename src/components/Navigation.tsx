'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/cart/store';

const NAV_LINKS = [
  { href: '/products', label: 'Products' },
  { href: '/search', label: 'Search' },
];

export function Navigation() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.itemCount);
  const openCart = useCartStore((s) => s.openCart);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <nav className="container-page flex items-center justify-between h-16" aria-label="Main navigation">
        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-xl text-gray-900 hover:text-indigo-600 transition-colors"
          aria-label="Headless Storefront home"
        >
          Headless<span className="text-indigo-600">Store</span>
        </Link>

        {/* Links */}
        <ul className="hidden md:flex items-center gap-6" role="list">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith(href)
                    ? 'text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                aria-current={pathname.startsWith(href) ? 'page' : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Cart button */}
        <button
          onClick={openCart}
          className="relative flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          aria-label={`Open cart (${itemCount} items)`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-6 h-6"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
            />
          </svg>
          <span className="hidden sm:inline">Cart</span>
          {itemCount > 0 && (
            <span
              className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1"
              aria-hidden="true"
            >
              {itemCount > 99 ? '99+' : itemCount}
            </span>
          )}
        </button>
      </nav>
    </header>
  );
}
