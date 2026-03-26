import { algoliasearch } from 'algoliasearch';

const appId = process.env['NEXT_PUBLIC_ALGOLIA_APP_ID'] ?? '';
const searchKey = process.env['NEXT_PUBLIC_ALGOLIA_SEARCH_KEY'] ?? '';

/** Browser-safe search client (uses search-only API key) */
export const searchClient = algoliasearch(appId, searchKey);

export const ALGOLIA_INDEX = process.env['ALGOLIA_INDEX'] ?? 'products';
