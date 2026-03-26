'use client';

import { useState } from 'react';
import { useCartStore } from '@/lib/cart/store';
import type { CommerceProduct } from '@/lib/commerce/types';

interface AddToCartButtonProps {
  product: CommerceProduct;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.openCart);
  const isLoading = useCartStore((s) => s.isLoading);

  const inStock = product.stockStatus === 'instock';
  const onBackorder = product.stockStatus === 'onbackorder';
  const canAdd = inStock || onBackorder;

  async function handleAddToCart() {
    await addItem(product.id, quantity);
    setAdded(true);
    openCart();
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Quantity selector */}
      {canAdd && (
        <div className="flex items-center gap-3">
          <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
            Quantity
          </label>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
            >
              −
            </button>
            <span
              id="quantity"
              className="px-4 py-2 text-sm font-medium min-w-[3rem] text-center"
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={!canAdd || isLoading}
        className={`btn-primary w-full justify-center text-base py-3.5 ${
          added ? 'bg-green-600 hover:bg-green-700' : ''
        }`}
        aria-label={canAdd ? `Add ${quantity} ${product.name} to cart` : `${product.name} is out of stock`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Adding...
          </span>
        ) : added ? (
          'Added to cart!'
        ) : canAdd ? (
          'Add to cart'
        ) : (
          'Out of stock'
        )}
      </button>
    </div>
  );
}
