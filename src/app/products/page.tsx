import { Suspense } from 'react';
import Link from 'next/link';
import { getCommerceAdapter } from '@/lib/commerce/provider';
import { ProductCard } from '@/components/ProductCard';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Products',
  description: 'Browse our full catalog of electronics, clothing, and accessories.',
  openGraph: {
    title: 'All Products | Headless Storefront',
    description: 'Browse our full catalog of electronics, clothing, and accessories.',
  },
};

type SearchParams = Promise<{
  category?: string;
  sort?: 'price_asc' | 'price_desc' | 'name_asc' | 'newest';
  page?: string;
}>;

const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'newest', label: 'Newest' },
] as const;

async function ProductGrid({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const { category, sort, page } = params;
  const currentPage = parseInt(page ?? '1', 10);

  const adapter = await getCommerceAdapter();
  const [{ products, total }, collections] = await Promise.all([
    adapter.getProducts({
      category,
      sort: sort as 'price_asc' | 'price_desc' | 'name_asc' | 'newest' | undefined,
      page: currentPage,
      limit: 12,
    }),
    adapter.getCollections(),
  ]);

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="lg:grid lg:grid-cols-[240px_1fr] gap-8">
      {/* Sidebar filters */}
      <aside aria-label="Product filters">
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
              Category
            </h2>
            <ul className="space-y-1" role="list">
              <li>
                <Link
                  href="/products"
                  className={`block text-sm py-1 px-2 rounded transition-colors ${
                    !category ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  aria-current={!category ? 'true' : undefined}
                >
                  All Products
                  <span className="ml-1 text-gray-400">({total})</span>
                </Link>
              </li>
              {collections.map((col) => (
                <li key={col.id}>
                  <Link
                    href={`/products?category=${col.slug}${sort ? `&sort=${sort}` : ''}`}
                    className={`block text-sm py-1 px-2 rounded transition-colors ${
                      category === col.slug
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    aria-current={category === col.slug ? 'true' : undefined}
                  >
                    {col.name}
                    <span className="ml-1 text-gray-400">({col.productCount})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      {/* Product grid */}
      <div>
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            {total === 0 ? 'No products found' : `${total} product${total !== 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-sm text-gray-600 sr-only">
              Sort by
            </label>
            <select
              id="sort-select"
              defaultValue={sort ?? ''}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus-visible:outline-indigo-600"
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) {
                  url.searchParams.set('sort', e.target.value);
                } else {
                  url.searchParams.delete('sort');
                }
                url.searchParams.delete('page');
                window.location.href = url.toString();
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">No products match your filters.</p>
            <Link href="/products" className="btn-primary">
              Clear filters
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 3} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Product pagination" className="mt-10 flex justify-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/products?${new URLSearchParams({
                      ...(category ? { category } : {}),
                      ...(sort ? { sort } : {}),
                      page: String(p),
                    }).toString()}`}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      p === currentPage
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    aria-current={p === currentPage ? 'page' : undefined}
                    aria-label={`Page ${p}`}
                  >
                    {p}
                  </Link>
                ))}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="container-page py-12">
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">All Products</h1>
      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
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
        <ProductGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
