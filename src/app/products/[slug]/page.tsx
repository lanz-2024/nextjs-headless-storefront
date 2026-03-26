import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCommerceAdapter } from '@/lib/commerce/provider';
import { AddToCartButton } from '@/components/AddToCartButton';
import type { Metadata } from 'next';

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const adapter = await getCommerceAdapter();
  const product = await adapter.getProduct(slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const title = product.seo?.title ?? product.name;
  const description = product.seo?.description ?? product.shortDescription ?? product.description.slice(0, 160);
  const image = product.images[0];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: image
        ? [{ url: image.src, alt: image.alt, width: image.width, height: image.height }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image.src] : [],
    },
  };
}

export async function generateStaticParams() {
  const adapter = await getCommerceAdapter();
  const { products } = await adapter.getProducts({ limit: 100 });
  return products.map((p) => ({ slug: p.slug }));
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const adapter = await getCommerceAdapter();
  const product = await adapter.getProduct(slug);

  if (!product) notFound();

  const inStock = product.stockStatus === 'instock';
  const onBackorder = product.stockStatus === 'onbackorder';
  const hasDiscount =
    product.compareAtPrice !== undefined && product.compareAtPrice > product.price;

  const primaryImage = product.images[0];
  const additionalImages = product.images.slice(1);

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images.map((img) => img.src),
    offers: {
      '@type': 'Offer',
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
      availability:
        product.stockStatus === 'instock'
          ? 'https://schema.org/InStock'
          : product.stockStatus === 'onbackorder'
          ? 'https://schema.org/BackOrder'
          : 'https://schema.org/OutOfStock',
      url: `${process.env['NEXT_PUBLIC_SITE_URL'] ?? ''}/products/${product.slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-page py-8 md:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-gray-900 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/products" className="hover:text-gray-900 transition-colors">
                Products
              </Link>
            </li>
            {product.categories[0] && (
              <>
                <li aria-hidden="true">/</li>
                <li>
                  <Link
                    href={`/products?category=${product.categories[0].slug}`}
                    className="hover:text-gray-900 transition-colors"
                  >
                    {product.categories[0].name}
                  </Link>
                </li>
              </>
            )}
            <li aria-hidden="true">/</li>
            <li className="text-gray-900 font-medium" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden">
              {primaryImage ? (
                <Image
                  src={primaryImage.src}
                  alt={primaryImage.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  No image available
                </div>
              )}
            </div>

            {additionalImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {additionalImages.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden"
                  >
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      sizes="(max-width: 1024px) 25vw, 12vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col">
            {/* Categories */}
            {product.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {product.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    className="text-xs uppercase tracking-wide text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-gray-900">
                ${product.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xl text-gray-400 line-through">
                  ${product.compareAtPrice!.toFixed(2)}
                </span>
              )}
              {hasDiscount && (
                <span className="badge badge-green text-sm">
                  Save ${(product.compareAtPrice! - product.price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock status */}
            <div className="mb-6">
              {inStock ? (
                <p className="text-sm font-medium text-green-600">
                  In stock
                  {product.stockQuantity !== undefined && product.stockQuantity <= 10 && (
                    <span className="ml-1 text-amber-600">
                      — only {product.stockQuantity} left
                    </span>
                  )}
                </p>
              ) : onBackorder ? (
                <p className="text-sm font-medium text-amber-600">Available on backorder</p>
              ) : (
                <p className="text-sm font-medium text-red-600">Out of stock</p>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-sm text-gray-600 mb-8 max-w-none">
              {product.shortDescription ? (
                <p className="text-base">{product.shortDescription}</p>
              ) : (
                <p>{product.description.slice(0, 300)}{product.description.length > 300 ? '...' : ''}</p>
              )}
            </div>

            {/* Add to cart */}
            <AddToCartButton product={product} />

            {/* Attributes */}
            {product.attributes.length > 0 && (
              <div className="mt-8 space-y-4 border-t border-gray-200 pt-6">
                {product.attributes.map((attr) => (
                  <div key={attr.name}>
                    <p className="text-sm font-semibold text-gray-900 mb-2">{attr.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {attr.options.map((opt) => (
                        <span
                          key={opt}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Full description */}
            {product.description.length > 300 && (
              <details className="mt-8 border-t border-gray-200 pt-6">
                <summary className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors">
                  Full description
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{product.description}</p>
              </details>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
