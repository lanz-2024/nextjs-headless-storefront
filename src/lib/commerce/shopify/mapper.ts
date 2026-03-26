import type {
  CommerceCart,
  CommerceCartItem,
  CommerceCollection,
  CommerceProduct,
  CommerceProductVariant,
} from '../types';

type Edge<T> = { node: T };
type Connection<T> = { edges: Edge<T>[] };

interface ShopifyMoneyV2 {
  amount: string;
  currencyCode: string;
}

interface ShopifyImage {
  url: string;
  altText: string | null;
  width?: number | null;
  height?: number | null;
}

interface ShopifyVariantNode {
  id: string;
  sku?: string;
  price: ShopifyMoneyV2;
  compareAtPrice?: ShopifyMoneyV2 | null;
  availableForSale: boolean;
  quantityAvailable?: number | null;
  selectedOptions: { name: string; value: string }[];
}

interface ShopifyCollectionNode {
  id: string;
  handle: string;
  title: string;
}

interface ShopifyProductNode {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  priceRange: { minVariantPrice: ShopifyMoneyV2 };
  compareAtPriceRange?: { minVariantPrice: ShopifyMoneyV2 };
  images: Connection<ShopifyImage>;
  collections: Connection<ShopifyCollectionNode>;
  variants: Connection<ShopifyVariantNode>;
  seo?: { title: string; description: string };
}

interface ShopifyCartLineNode {
  id: string;
  quantity: number;
  cost: { totalAmount: ShopifyMoneyV2 };
  merchandise: {
    id: string;
    title: string;
    price: ShopifyMoneyV2;
    product: {
      id: string;
      handle: string;
      title: string;
      images: Connection<ShopifyImage>;
    };
  };
}

interface ShopifyCartNode {
  id: string;
  checkoutUrl?: string;
  cost: {
    subtotalAmount: ShopifyMoneyV2;
    totalAmount: ShopifyMoneyV2;
  };
  lines: Connection<ShopifyCartLineNode>;
}

function unwrap<T>(connection: Connection<T>): T[] {
  return connection.edges.map((e) => e.node);
}

function parseAmount(money: ShopifyMoneyV2): number {
  return parseFloat(money.amount);
}

export function mapShopifyProduct(node: ShopifyProductNode): CommerceProduct {
  const images = unwrap(node.images);
  const collections = unwrap(node.collections);
  const variants = unwrap(node.variants);

  const basePrice = parseAmount(node.priceRange.minVariantPrice);
  const compareAtAmount = node.compareAtPriceRange?.minVariantPrice
    ? parseAmount(node.compareAtPriceRange.minVariantPrice)
    : undefined;

  const mappedVariants: CommerceProductVariant[] = variants.map((v) => ({
    id: v.id,
    sku: v.sku ?? '',
    price: parseAmount(v.price),
    stockStatus: v.availableForSale ? 'instock' : 'outofstock',
    attributes: Object.fromEntries(v.selectedOptions.map((o) => [o.name, o.value])),
  }));

  const inStock = variants.some((v) => v.availableForSale);

  return {
    id: node.id,
    slug: node.handle,
    name: node.title,
    description: node.description,
    price: basePrice,
    compareAtPrice: compareAtAmount,
    currency: node.priceRange.minVariantPrice.currencyCode,
    sku: variants[0]?.sku ?? '',
    stockStatus: inStock ? 'instock' : 'outofstock',
    images: images.map((img) => ({
      src: img.url,
      alt: img.altText ?? node.title,
      width: img.width ?? 800,
      height: img.height ?? 800,
    })),
    categories: collections.map((c) => ({
      id: c.id,
      name: c.title,
      slug: c.handle,
    })),
    tags: node.tags,
    attributes: [],
    variants: mappedVariants,
    seo: node.seo,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  };
}

export function mapShopifyCart(node: ShopifyCartNode): CommerceCart {
  const lines = unwrap(node.lines);

  const items: CommerceCartItem[] = lines.map((line) => {
    const firstImage = line.merchandise.product.images.edges[0]?.node;
    return {
      id: line.id,
      productId: line.merchandise.product.id,
      variantId: line.merchandise.id,
      name: line.merchandise.product.title,
      price: parseAmount(line.merchandise.price),
      quantity: line.quantity,
      image: {
        src: firstImage?.url ?? '',
        alt: firstImage?.altText ?? line.merchandise.product.title,
      },
      slug: line.merchandise.product.handle,
    };
  });

  const subtotal = parseAmount(node.cost.subtotalAmount);
  const total = parseAmount(node.cost.totalAmount);

  return {
    id: node.id,
    items,
    subtotal,
    total,
    currency: node.cost.subtotalAmount.currencyCode,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

export function mapShopifyCollection(node: ShopifyCollectionNode): CommerceCollection {
  return {
    id: node.id,
    name: node.title,
    slug: node.handle,
    productCount: 0,
  };
}

export type {
  ShopifyCartNode,
  ShopifyProductNode,
  ShopifyCollectionNode,
};
