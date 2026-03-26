# Deployment

## Vercel (Recommended)

Live demo: https://nextjs-headless-storefront.vercel.app

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COMMERCE_PROVIDER` | Yes | `mock` | `mock`, `woocommerce`, or `shopify` |
| `WC_BASE_URL` | WC only | — | WooCommerce store URL |
| `WC_CONSUMER_KEY` | WC only | — | WooCommerce REST API consumer key |
| `WC_CONSUMER_SECRET` | WC only | — | WooCommerce REST API consumer secret |
| `SHOPIFY_STORE_DOMAIN` | Shopify only | — | `your-store.myshopify.com` |
| `SHOPIFY_STOREFRONT_TOKEN` | Shopify only | — | Shopify Storefront API token |
| `ALGOLIA_APP_ID` | No | — | Algolia application ID |
| `ALGOLIA_SEARCH_API_KEY` | No | — | Algolia search-only API key |
| `GTM_ID` | No | — | Google Tag Manager container ID (`GTM-XXXXXX`) |
| `REVALIDATE_TOKEN` | No | — | HMAC token for ISR webhook verification |

### Deploy (Mock Mode — zero config)

```bash
vercel --prod
# No env vars needed — mock adapter works out of the box
```

### Deploy (WooCommerce)

1. Set up WooCommerce (or use `docker compose up -d`)
2. Create REST API keys: WooCommerce → Settings → Advanced → REST API
3. Set `COMMERCE_PROVIDER=woocommerce` and WC variables in Vercel
4. `vercel --prod`

### Deploy (Shopify)

1. Create Shopify Partner development store
2. Create Storefront API token with `unauthenticated_read_product_listings`
3. Set `COMMERCE_PROVIDER=shopify` and Shopify variables in Vercel
4. `vercel --prod`

## Docker (WooCommerce local stack)

```bash
docker compose up -d
# App:         http://localhost:3000
# WooCommerce: http://localhost:8080/wp-admin
# Adminer:     http://localhost:8081
```

## ISR Webhook (On-Demand Revalidation)

Trigger revalidation when inventory changes:

```bash
curl -X POST https://your-domain.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-token: your-hmac-token" \
  -d '{"slug": "blue-denim-jacket"}'
```

## Rollback

Vercel deployments are immutable — roll back via Vercel dashboard → Deployments → Promote previous deployment.
