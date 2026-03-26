# GTM Events

Type-safe GA4 events fired via Google Tag Manager's data layer.

## Setup

1. Create GTM container at tagmanager.google.com
2. Set `GTM_ID=GTM-XXXXXX` in environment variables
3. In GTM, create GA4 Configuration and Event triggers for each event below

## Event Reference

### `view_item`
Fired on product detail page load.

```typescript
window.dataLayer.push({
  event: 'view_item',
  currency: 'USD',
  value: 29.99,
  items: [{
    item_id: 'classic-white-t-shirt',
    item_name: 'Classic White T-Shirt',
    item_category: 'Clothing',
    price: 29.99,
    quantity: 1,
  }]
});
```

### `add_to_cart`
Fired when a product is added to the cart.

```typescript
window.dataLayer.push({
  event: 'add_to_cart',
  currency: 'USD',
  value: 29.99,
  items: [{ item_id: '...', item_name: '...', price: 29.99, quantity: 1 }]
});
```

### `remove_from_cart`
Fired when a product is removed from the cart drawer.

### `view_cart`
Fired when the cart drawer opens.

### `begin_checkout`
Fired when the user clicks "Proceed to Checkout".

### `purchase`
Fired after successful order placement.

```typescript
window.dataLayer.push({
  event: 'purchase',
  transaction_id: 'ORDER-12345',
  value: 89.99,
  tax: 8.00,
  shipping: 5.99,
  currency: 'USD',
  items: [{ item_id: '...', item_name: '...', price: 89.99, quantity: 1 }]
});
```

## Implementation

All events are fired via the `useDataLayer()` hook:

```typescript
const { push } = useDataLayer();
push({ event: 'add_to_cart', ... });
```

See `src/lib/gtm/data-layer.ts` for the typed implementation.
The GTM script is injected in `src/app/layout.tsx` via `src/lib/gtm/provider.tsx`.
