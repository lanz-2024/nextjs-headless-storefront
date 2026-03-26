import { Suspense } from 'react';
import { getCommerceAdapter } from '@/lib/commerce/provider';
import { ProductCard } from '@/components/ProductCard';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Products',
  description: 'Search our full product catalog.',
  robots: { index: false, follow: true },
};

type SearchParams = Promise<{ q?: string; category?: string }>;

async function SearchResults({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? '';

  if (!query) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Enter a search term to find products.</p>
      </div>
    );
  }

  const adapter = await getCommerceAdapter();
  const { products } = await adapter.getProducts({ limit: 50 });

  // Client-side filtering by name/description/tags since we're using mock/WC
  const q = query.toLowerCase();
  const results = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)) ||
      p.categories.some((c) => c.name.toLowerCase().includes(q))
  );

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-900 font-medium text-lg mb-2">
          No results for &ldquo;{query}&rdquo;
        </p>
        <p className="text-gray-500">Try a different search term or browse all products.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((product, i) => (
          <ProductCard key={product.id} product={product} priority={i < 4} />
        ))}
      </div>
    </div>
  );
}

export default function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="container-page py-12">
      {/* Search form */}
      <div className="max-w-2xl mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Products</h1>
        <form action="/search" method="GET" role="search">
          <div className="flex gap-3">
            <label htmlFor="search-input" className="sr-only">
              Search products
            </label>
            <input
              id="search-input"
              type="search"
              name="q"
              placeholder="Search headphones, keyboards..."
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus-visible:outline-indigo-600 text-base"
              autoComplete="off"
              aria-label="Search products"
            />
            <button
              type="submit"
              className="btn-primary px-6"
              aria-label="Submit search"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-product bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
