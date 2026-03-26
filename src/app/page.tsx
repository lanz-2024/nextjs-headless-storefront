import type { Metadata } from 'next';
import Link from 'next/link';
import { getCommerceAdapter } from '@/lib/commerce/provider';
import { ProductCard } from '@/components/ProductCard';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Home — Headless Storefront',
  description:
    'Discover the latest electronics, clothing, and accessories. Free shipping on orders over $50.',
};

const CATEGORIES = [
  {
    slug: 'electronics',
    name: 'Electronics',
    description: 'Laptops, headphones & cameras',
    emoji: '💻',
    color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  {
    slug: 'clothing',
    name: 'Clothing',
    description: 'Merino wool, organic cotton & more',
    emoji: '👕',
    color: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
  },
  {
    slug: 'accessories',
    name: 'Accessories',
    description: 'Bags, wallets & sunglasses',
    emoji: '👜',
    color: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
  },
];

export default async function HomePage() {
  const adapter = await getCommerceAdapter();
  const featured = await adapter.getFeaturedProducts(6);

  return (
    <>
      {/* Hero */}
      <section
        aria-label="Hero"
        className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white"
      >
        <div className="container-page py-20 md:py-28 lg:py-36">
          <div className="max-w-2xl">
            <p className="text-indigo-200 font-medium tracking-wide uppercase text-sm mb-4">
              New arrivals
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
              Shop Smarter. Live Better.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-indigo-100 text-balance">
              Curated electronics, sustainable clothing, and premium accessories — all in one
              headless storefront powered by the adapter pattern.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/products" className="btn-primary text-base">
                Shop all products
              </Link>
              <Link
                href="/search"
                className="btn-secondary text-base border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Search
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 70% 50%, rgba(139,92,246,0.3) 0%, transparent 60%)',
          }}
          aria-hidden="true"
        />
      </section>

      {/* Categories */}
      <section aria-labelledby="categories-heading" className="py-16 bg-gray-50">
        <div className="container-page">
          <h2
            id="categories-heading"
            className="text-2xl md:text-3xl font-bold text-gray-900 mb-8"
          >
            Shop by Category
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/products?category=${cat.slug}`}
                className={`card p-6 border transition-colors duration-150 ${cat.color}`}
              >
                <span className="text-3xl" role="img" aria-hidden="true">
                  {cat.emoji}
                </span>
                <h3 className="mt-3 font-semibold text-gray-900">{cat.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{cat.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section aria-labelledby="featured-heading" className="py-16">
        <div className="container-page">
          <div className="flex items-center justify-between mb-8">
            <h2 id="featured-heading" className="text-2xl md:text-3xl font-bold text-gray-900">
              Featured Products
            </h2>
            <Link
              href="/products"
              className="text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 3} />
            ))}
          </div>
        </div>
      </section>

      {/* Value props */}
      <section aria-labelledby="value-props-heading" className="py-16 bg-indigo-600 text-white">
        <div className="container-page">
          <h2 id="value-props-heading" className="sr-only">
            Why shop with us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { title: 'Free Shipping', body: 'On all orders over $50. Delivered in 3–5 days.' },
              { title: 'Easy Returns', body: '30-day returns on all items, no questions asked.' },
              { title: 'Secure Checkout', body: 'HTTPS + CSP enforced. Your data is safe.' },
            ].map((vp) => (
              <div key={vp.title}>
                <p className="font-semibold text-lg">{vp.title}</p>
                <p className="mt-2 text-indigo-100 text-sm">{vp.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
