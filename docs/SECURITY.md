# Security

## Content Security Policy

CSP headers configured in `next.config.ts`:

```
default-src 'self';
script-src 'self' https://www.googletagmanager.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://*.algolia.net https://*.algolianet.com;
frame-ancestors 'none';
```

## CSRF Protection

- Server Actions use built-in Next.js CSRF protection
- ISR revalidation endpoint uses HMAC-SHA256 signature verification (`x-revalidate-token`)
- API routes verify `Origin` header against `NEXT_PUBLIC_APP_URL`

## Input Validation

- All Server Action inputs validated with Zod schemas
- Search queries sanitized before passing to Algolia
- URL slug parameters validated as `[a-z0-9-]+` pattern only

## Secrets Management

- WooCommerce/Shopify API keys are server-only (never in `NEXT_PUBLIC_` variables)
- `.env.local` is gitignored; `.env.example` has placeholder values
- Production secrets stored in Vercel environment variables (encrypted at rest)

## Commerce Adapters

- WooCommerce: consumer key/secret passed as HTTP Basic auth header (server-only)
- Shopify: Storefront API token is a public read-only token (designed for client use, but kept server-side here for extra protection)
- Both adapters validate response schemas with Zod before mapping

## OWASP Top 10 Coverage

| Risk | Mitigation |
|------|-----------|
| A01 Broken Access Control | Read-only storefront — no user mutations |
| A03 Injection | Zod validation on all inputs, no raw SQL |
| A05 Security Misconfiguration | CSP headers, no debug endpoints in prod, HSTS via Vercel |
| A06 Vulnerable Components | `pnpm audit` in CI, security-focused devDependencies |
| A09 Logging | Vercel observability for API routes and Server Actions |
