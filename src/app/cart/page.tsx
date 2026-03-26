'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/cart/store';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const total = useCartStore((s) => s.total);
  const isLoading = useCartStore((s) => s.isLoading);
  const error = useCartStore((s) => s.error);
  const clearError = useCartStore((s) => s.clearError);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);

  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center max-w-lg mx-auto">
        <svg
          className="w-20 h-20 text-gray-300 mx-auto mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
          />
        </svg>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">
          Looks like you haven&apos;t added anything yet. Browse our products to get started.
        </p>
        <Link href="/products" className="btn-primary text-base">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4"
        >
          <span className="flex-1 text-sm">{error}</span>
          <button
            onClick={clearError}
            className="text-red-500 hover:text-red-700 transition-colors"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_340px] gap-12">
        {/* Items */}
        <div>
          <ul className="divide-y divide-gray-200" role="list" aria-label="Cart items">
            {items.map((item) => (
              <li key={item.id} className="flex gap-6 py-6">
                {/* Image */}
                <Link href={`/products/${item.slug}`} className="flex-shrink-0">
                  <div className="relative w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-xl overflow-hidden">
                    {item.image.src ? (
                      <Image
                        src={item.image.src}
                        alt={item.image.alt}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                </Link>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h2 className="font-semibold text-gray-900 leading-snug">
                        <Link
                          href={`/products/${item.slug}`}
                          className="hover:text-indigo-600 transition-colors"
                        >
                          {item.name}
                        </Link>
                      </h2>
                      <p className="text-sm text-gray-500 mt-0.5">${item.price.toFixed(2)} each</p>
                    </div>
                    <p className="font-bold text-gray-900 flex-shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        aria-label={`Decrease quantity of ${item.name}`}
                        disabled={isLoading}
                      >
                        −
                      </button>
                      <span className="px-4 py-1.5 text-sm font-medium min-w-[3rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        aria-label={`Increase quantity of ${item.name}`}
                        disabled={isLoading}
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                      disabled={isLoading}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="pt-4">
            <Link
              href="/products"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              &larr; Continue shopping
            </Link>
          </div>
        </div>

        {/* Order summary */}
        <div className="mt-10 lg:mt-0">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="text-green-600 font-medium">
                  {subtotal >= 50 ? 'Free' : '$9.99'}
                </span>
              </div>
              {subtotal < 50 && (
                <p className="text-xs text-gray-500 bg-amber-50 border border-amber-200 rounded p-2">
                  Add ${(50 - subtotal).toFixed(2)} more for free shipping.
                </p>
              )}
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>${(total + (subtotal >= 50 ? 0 : 9.99)).toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="btn-primary w-full justify-center mt-6 text-base py-3.5"
            >
              Proceed to Checkout
            </Link>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure checkout — HTTPS encrypted
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
