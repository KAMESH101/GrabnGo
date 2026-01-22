/**
 * Products Service Layer
 * Handles all product-related operations using centralized database
 */

import { Product, Category } from '../types';
import {
  getAllProducts as dbGetAllProducts,
  getProductById as dbGetProductById,
  getProductsByOwnerId as dbGetProductsByOwnerId,
  getProductsByCategory as dbGetProductsByCategory,
  getAvailableProducts as dbGetAvailableProducts,
  createProduct as dbCreateProduct,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  searchProducts as dbSearchProducts,
  getProductsByLocality as dbGetProductsByLocality,
  getProductsByDistance as dbGetProductsByDistance,
} from './database';

/**
 * Get all products (admin use)
 */
export const getAllProducts = async (): Promise<Product[]> => {
  console.log('🔍 [PRODUCTS SERVICE] Fetching all products');
  return dbGetAllProducts();
};

/**
 * Get available products for customer discovery
 */
export const getAvailableProducts = async (): Promise<Product[]> => {
  console.log('🔍 [PRODUCTS SERVICE] Fetching available products');
  return dbGetAvailableProducts();
};

/**
 * Get product by ID
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  console.log('🔍 [PRODUCTS SERVICE] Fetching product:', productId);
  return dbGetProductById(productId);
};

/**
 * Get products by owner ID
 */
export const getOwnerProducts = async (ownerId: string): Promise<Product[]> => {
  console.log('🔍 [PRODUCTS SERVICE] Fetching products for owner:', ownerId);
  return dbGetProductsByOwnerId(ownerId);
};

// Export database function directly for hook usage
export { getProductsByOwnerId } from './database';

/**
 * Get products by category
 */
export const getProductsByCategory = async (category: Category): Promise<Product[]> => {
  console.log('🔍 [PRODUCTS SERVICE] Fetching products for category:', category);
  return dbGetProductsByCategory(category);
};

/**
 * Search products by query
 */
export const searchProducts = async (query: string): Promise<Product[]> => {
  console.log('🔍 [PRODUCTS SERVICE] Searching products:', query);
  return dbSearchProducts(query);
};

/**
 * Get products by locality
 */
export const getProductsByLocality = async (locality: string): Promise<Product[]> => {
  console.log('🔍 [PRODUCTS SERVICE] Fetching products for locality:', locality);
  return dbGetProductsByLocality(locality);
};

/**
 * Get products sorted by distance from user location
 */
export const getNearbyProducts = async (
  userLat: number,
  userLng: number,
  maxDistanceKm: number = 50
): Promise<Product[]> => {
  console.log('🔍 [PRODUCTS SERVICE] Fetching nearby products:', { userLat, userLng, maxDistanceKm });
  return dbGetProductsByDistance(userLat, userLng, maxDistanceKm);
};

/**
 * Create a new product listing
 */
export const createProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
  const product: Product = {
    ...productData,
    id: `product_${Date.now()}_${Math.random().toString(36).substring(7)}`,
  };

  console.log('📝 [PRODUCTS SERVICE] Creating product:', {
    id: product.id,
    title: product.title,
    ownerId: product.ownerId,
    category: product.category,
  });

  return dbCreateProduct(product);
};

/**
 * Update an existing product
 */
export const updateProduct = async (
  productId: string,
  updates: Partial<Product>
): Promise<Product> => {
  console.log('🔄 [PRODUCTS SERVICE] Updating product:', productId, updates);
  return dbUpdateProduct(productId, updates);
};

/**
 * Delete a product
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  console.log('🗑️ [PRODUCTS SERVICE] Deleting product:', productId);
  return dbDeleteProduct(productId);
};

/**
 * Toggle product availability
 */
export const toggleProductAvailability = async (productId: string): Promise<Product> => {
  const product = await dbGetProductById(productId);
  
  if (!product) {
    throw new Error('Product not found');
  }

  return dbUpdateProduct(productId, { availability: !product.availability });
};