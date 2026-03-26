import type { CommerceProduct } from '../types';

type WCImageRecord = { src?: string; alt?: string };
type WCCategoryRecord = { id?: unknown; name?: unknown; slug?: unknown };
type WCTagRecord = { name?: string };
type WCAttributeRecord = { name?: unknown; options?: unknown };

export function mapWCProduct(wc: Record<string, unknown>): CommerceProduct {
  const regularPrice = parseFloat(String(wc['regular_price'] ?? wc['price'] ?? '0'));
  const salePrice =
    wc['sale_price'] && String(wc['sale_price']).length > 0
      ? parseFloat(String(wc['sale_price']))
      : undefined;
  const effectivePrice = salePrice ?? regularPrice;

  const rawImages = (wc['images'] as WCImageRecord[] | undefined) ?? [];
  const rawCategories = (wc['categories'] as WCCategoryRecord[] | undefined) ?? [];
  const rawTags = (wc['tags'] as WCTagRecord[] | undefined) ?? [];
  const rawAttributes = (wc['attributes'] as WCAttributeRecord[] | undefined) ?? [];

  return {
    id: String(wc['id']),
    slug: String(wc['slug']),
    name: String(wc['name']),
    description: String(wc['description'] ?? ''),
    shortDescription:
      wc['short_description'] && String(wc['short_description']).length > 0
        ? String(wc['short_description'])
        : undefined,
    price: effectivePrice,
    compareAtPrice: salePrice !== undefined ? regularPrice : undefined,
    currency: 'USD',
    sku: String(wc['sku'] ?? ''),
    stockStatus: mapStockStatus(String(wc['stock_status'] ?? 'instock')),
    stockQuantity: wc['stock_quantity'] != null ? Number(wc['stock_quantity']) : undefined,
    images: rawImages.map((img) => ({
      src: img.src ?? '',
      alt: img.alt ?? '',
      width: 800,
      height: 800,
    })),
    categories: rawCategories.map((cat) => ({
      id: String(cat.id ?? ''),
      name: String(cat.name ?? ''),
      slug: String(cat.slug ?? ''),
    })),
    tags: rawTags.map((t) => t.name ?? '').filter(Boolean),
    attributes: rawAttributes.map((attr) => ({
      name: String(attr.name ?? ''),
      options: Array.isArray(attr.options) ? (attr.options as string[]) : [],
    })),
    createdAt: String(wc['date_created'] ?? new Date().toISOString()),
    updatedAt: String(wc['date_modified'] ?? new Date().toISOString()),
  };
}

function mapStockStatus(status: string): CommerceProduct['stockStatus'] {
  if (status === 'outofstock') return 'outofstock';
  if (status === 'onbackorder') return 'onbackorder';
  return 'instock';
}
