/**
 * parseProductImages.ts
 * Parses image assets from src/assets/ using filename convention:
 *   "Product Name_Category.ext"
 *
 * Uses Vite 6 import.meta.glob to load asset URLs at build time.
 */

import { Category } from '../types';

// ── Vite 6 glob: returns { path -> hashed URL } at build time ────────────────
const assetImages = import.meta.glob(
  '/src/assets/*.{jpg,jpeg,png,webp}',
  { query: '?url', import: 'default', eager: true }
) as Record<string, string>;

// ── Category normalization (handles singular, plural, mixed-case) ─────────────
const CATEGORY_MAP: Record<string, Category> = {
  bike:        'Bikes',
  bikes:       'Bikes',
  car:         'Cars',
  cars:        'Cars',
  drone:       'Drones',
  drones:      'Drones',
  camera:      'Cameras',
  cameras:     'Cameras',
  equipment:   'Equipments',
  equipments:  'Equipments',
};

export interface ParsedProductImage {
  /** Cleaned, display-ready product name extracted from filename */
  name: string;
  /** Normalized Category type */
  category: Category;
  /** Hashed/resolved URL returned by Vite for use in <img src> */
  imageUrl: string;
  /** Original filename (for debugging) */
  filename: string;
}

// ── Filter: skip hash-named files (no _ separator or not recognizable) ────────
const isProductImage = (path: string): boolean => {
  const filename = path.split('/').pop() || '';
  // Must have underscore separator
  if (!filename.includes('_')) return false;
  // Must NOT look like a content-hash filename (40-char hex)
  if (/^[a-f0-9]{40}\./.test(filename)) return false;
  return true;
};

/**
 * Parse all product images from src/assets/ and return structured data.
 * Filtering excludes non-product (hashed) files automatically.
 */
export const parseProductImages = (): ParsedProductImage[] => {
  const results: ParsedProductImage[] = [];

  for (const [path, imageUrl] of Object.entries(assetImages)) {
    if (!isProductImage(path)) continue;

    const filename = path.split('/').pop() || '';

    // Remove extension
    const withoutExt = filename.replace(/\.[^.]+$/, '');

    // Split on LAST underscore to separate name from category
    const lastUnderscore = withoutExt.lastIndexOf('_');
    if (lastUnderscore === -1) continue;

    const rawName = withoutExt.substring(0, lastUnderscore).trim();
    const rawCategory = withoutExt.substring(lastUnderscore + 1).trim().toLowerCase();

    const category = CATEGORY_MAP[rawCategory];
    if (!category || !rawName) continue; // skip unknown categories

    // Collapse multiple spaces in name (e.g. "DJI Mini 3 Pro  Lightweight" → "DJI Mini 3 Pro Lightweight")
    const cleanName = rawName.replace(/\s{2,}/g, ' ');

    results.push({ name: cleanName, category, imageUrl, filename });
  }

  return results;
};

/**
 * Get a parsed product image by product name (case-insensitive substring match).
 * Returns null if not found.
 */
export const getProductImage = (nameKeyword: string): string | null => {
  const all = parseProductImages();
  const lower = nameKeyword.toLowerCase();
  const match = all.find(p => p.name.toLowerCase().includes(lower));
  return match ? match.imageUrl : null;
};
