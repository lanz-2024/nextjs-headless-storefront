'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/cart/store';
import type { CommerceProduct } from '@/lib/commerce/types';

interface ProductCardProps {
  product: CommerceProduct;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);

  const image = product.images[0];
  const inStock = product.stockStatus === 'instock';
  const hasDiscount = product.compareAtPrice !== undefined && product.compareAtPrice > product.price;

  async function handleAddToCart() {
    await addItem(product.id, 1);
    openCart();
  }

  return (
    <article className="card group flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative block overflow-hidden"
        aria-label={product.name}
      >
        <div className="aspect-product bg-gray-100 relative overflow-hidden">
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              priority={priority}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-gray-400 text-sm">
              No image
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="badge badge-green">Sale</span>
            )}
            {product.stockStatus === 'outofstock' && (
              <span className="badge badge-red">Out of stock</span>
            )}
            {product.stockStatus === 'onbackorder' && (
              <span className="badge bg-amber-100 text-amber-800">On backorder</span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4">
        {product.categories.length > 0 && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.categories[0]?.name}
          </p>
        )}

        <h3 className="font-semibold text-gray-900 leading-snug mb-2 line-clamp-2">
          <Link href={`/products/${product.slug}`} className="hover:text-indigo-600 transition-colors">
            {product.name}
          </Link>
        </h3>

        {product.shortDescription && (
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{product.shortDescription}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2">
          <div>
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="ml-2 text-sm text-gray-400 line-through">
                ${product.compareAtPrice!.toFixed(2)}
              </span>
            )}
          </div>

          {inStock ? (
            <button
              onClick={handleAddToCart}
              className="btn-primary py-2 px-4 text-sm"
              aria-label={`Add ${product.name} to cart`}
            >
              Add to cart
            </button>
          ) : (
            <span className="text-sm text-gray-400">Unavailable</span>
          )}
        </div>
      </div>
    </article>
  );
}
