/**
 * Hook to manage product data
 */

import { useState, useEffect, useCallback } from 'react';
import { Product, Category } from '../types';
import {
  getAvailableProducts,
  getProductsByCategory,
  searchProducts as searchProductsService,
  getNearbyProducts,
} from '../services/products';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedProducts = await getAvailableProducts();
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('❌ [USE PRODUCTS] Error fetching products:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchProductsByCategory = useCallback(async (category: Category) => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedProducts = await getProductsByCategory(category);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('❌ [USE PRODUCTS] Error fetching products by category:', err);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedProducts = await searchProductsService(query);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('❌ [USE PRODUCTS] Error searching products:', err);
      setError('Failed to search products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchNearbyProducts = useCallback(async (
    lat: number,
    lng: number,
    maxDistanceKm: number = 50
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedProducts = await getNearbyProducts(lat, lng, maxDistanceKm);
      setProducts(fetchedProducts);
    } catch (err) {
      console.error('❌ [USE PRODUCTS] Error fetching nearby products:', err);
      setError('Failed to load nearby products');
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    products,
    isLoading,
    error,
    fetchProducts,
    fetchProductsByCategory,
    searchProducts,
    fetchNearbyProducts,
  };
};
