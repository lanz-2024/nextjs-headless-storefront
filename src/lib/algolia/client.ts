// algoliasearch is an optional runtime dependency. When credentials are absent
// the stub below is used so the build succeeds without the package installed.

export const ALGOLIA_INDEX = process.env['ALGOLIA_INDEX'] ?? 'products';

export type SearchClient = {
  search: (requests: unknown) => Promise<unknown>;
};

// Stub client — replaced at runtime when algoliasearch is available and
// NEXT_PUBLIC_ALGOLIA_APP_ID / NEXT_PUBLIC_ALGOLIA_SEARCH_KEY are set.
export const searchClient: SearchClient = {
  search: async (_requests) => ({ results: [] }),
};
