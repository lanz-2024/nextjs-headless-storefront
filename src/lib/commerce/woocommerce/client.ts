interface WooCommerceClientConfig {
  baseUrl: string;
  consumerKey: string;
  consumerSecret: string;
  revalidate?: number;
}

export class WooCommerceClient {
  private readonly auth: string;
  private readonly baseUrl: string;
  private readonly revalidate: number;

  constructor(config: WooCommerceClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
    this.revalidate = config.revalidate ?? 60;
  }

  async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/wp-json/wc/v3${path}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${this.auth}`,
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      next: { revalidate: this.revalidate },
    });

    if (!res.ok) {
      throw new WooCommerceError(
        `WooCommerce API error: ${res.status} ${res.statusText}`,
        res.status,
        path
      );
    }

    return res.json() as Promise<T>;
  }

  async fetchWithTotal<T>(
    path: string,
    options?: RequestInit
  ): Promise<{ data: T; total: number }> {
    const url = `${this.baseUrl}/wp-json/wc/v3${path}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${this.auth}`,
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      next: { revalidate: this.revalidate },
    });

    if (!res.ok) {
      throw new WooCommerceError(
        `WooCommerce API error: ${res.status} ${res.statusText}`,
        res.status,
        path
      );
    }

    const total = parseInt(res.headers.get('X-WP-Total') ?? '0', 10);
    const data = (await res.json()) as T;

    return { data, total };
  }
}

export class WooCommerceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly path: string
  ) {
    super(message);
    this.name = 'WooCommerceError';
  }
}
