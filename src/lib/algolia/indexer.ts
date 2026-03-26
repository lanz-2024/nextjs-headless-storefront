import type { CommerceProduct } from '@/lib/commerce/types';

export interface AlgoliaProductRecord {
  objectID: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  sku: string;
  inStock: boolean;
  stockQuantity?: number;
  imageUrl: string;
  imageAlt: string;
  categories: string[];
  categoryIds: string[];
  categorySlugs: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export function mapProductToAlgoliaRecord(product: CommerceProduct): AlgoliaProductRecord {
  const firstImage = product.images[0];
  return {
    objectID: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    sku: product.sku,
    inStock: product.stockStatus === 'instock',
    stockQuantity: product.stockQuantity,
    imageUrl: firstImage?.src ?? '',
    imageAlt: firstImage?.alt ?? product.name,
    categories: product.categories.map((c) => c.name),
    categoryIds: product.categories.map((c) => c.id),
    categorySlugs: product.categories.map((c) => c.slug),
    tags: product.tags,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function mapProductsToAlgoliaRecords(
  products: CommerceProduct[]
): AlgoliaProductRecord[] {
  return products.map(mapProductToAlgoliaRecord);
}
