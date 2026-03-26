export interface ShopifyClientConfig {
  storeDomain: string;
  storefrontAccessToken: string;
  apiVersion?: string;
}

export interface ShopifyGraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  extensions?: { code: string };
}

export interface ShopifyGraphQLResponse<T> {
  data: T;
  errors?: ShopifyGraphQLError[];
}

export class ShopifyError extends Error {
  constructor(
    message: string,
    public readonly errors: ShopifyGraphQLError[]
  ) {
    super(message);
    this.name = 'ShopifyError';
  }
}

export class ShopifyClient {
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;

  constructor(config: ShopifyClientConfig) {
    const version = config.apiVersion ?? '2024-01';
    const domain = config.storeDomain.replace(/^https?:\/\//, '');
    this.endpoint = `https://${domain}/api/${version}/graphql.json`;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': config.storefrontAccessToken,
    };
  }

  async query<T>(
    query: string,
    variables?: Record<string, unknown>,
    options?: { revalidate?: number }
  ): Promise<T> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
      next: { revalidate: options?.revalidate ?? 60 },
    });

    if (!res.ok) {
      throw new ShopifyError(`Shopify HTTP error: ${res.status} ${res.statusText}`, []);
    }

    const json = (await res.json()) as ShopifyGraphQLResponse<T>;

    if (json.errors && json.errors.length > 0) {
      throw new ShopifyError(
        `Shopify GraphQL error: ${json.errors[0]?.message ?? 'Unknown error'}`,
        json.errors
      );
    }

    return json.data;
  }
}
