import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Navbar } from '../../components/shared/Navbar';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Slider } from '../../components/ui/slider';
import { Category, Product } from '../../types';
import { getAvailableProducts } from '../../services/products';
import { MapPin, Filter, Search, Loader2 } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as Category | null;

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: categoryParam || 'all',
    locality: 'all',
    priceRange: [0, 5000],
  });

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const fetchedProducts = await getAvailableProducts();
        setProducts(fetchedProducts);
        console.log('✅ [SEARCH PAGE] Products loaded:', fetchedProducts.length);
      } catch (error) {
        console.error('❌ [SEARCH PAGE] Error fetching products:', error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    if (filters.category && filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.locality && filters.locality !== 'all' && product.pickupLocality !== filters.locality) return false;
    if (product.pricePerDay < filters.priceRange[0] || product.pricePerDay > filters.priceRange[1]) return false;
    if (filters.search && !product.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  // Get unique localities from products
  const localities = Array.from(new Set(products.map(p => p.pickupLocality)));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <aside className="w-64 hidden md:block">
            <Card>
              <CardContent className="p-4 space-y-6">
                <div>
                  <h3 className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4" />
                    Filters
                  </h3>
                </div>

                <div>
                  <label className="text-sm mb-2 block">Category</label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters({ ...filters, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Cars">Cars</SelectItem>
                      <SelectItem value="Bikes">Bikes</SelectItem>
                      <SelectItem value="Drones">Drones</SelectItem>
                      <SelectItem value="Cameras">Cameras</SelectItem>
                      <SelectItem value="Equipments">Equipments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm mb-2 block">Locality</label>
                  <Select
                    value={filters.locality}
                    onValueChange={(value) => setFilters({ ...filters, locality: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Localities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Localities</SelectItem>
                      {localities.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm mb-3 block">
                    Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
                  </label>
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => setFilters({ ...filters, priceRange: value })}
                    max={5000}
                    step={100}
                    className="mb-2"
                  />
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setFilters({ search: '', category: 'all', locality: 'all', priceRange: [0, 5000] })
                  }
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for rentals..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-gray-600">
                {filteredProducts.length} rental{filteredProducts.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                  onClick={() => navigate(`/customer/product/${product.id}`)}
                >
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-48 object-cover"
                  />
                  <CardContent className="p-4">
                    <div className="text-xs text-indigo-600 mb-1">{product.category}</div>
                    <h3 className="mb-2 line-clamp-2">{product.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      {product.pickupLocality}
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xl text-indigo-600">₹{product.pricePerDay}</span>
                        <span className="text-sm text-gray-500">/day</span>
                      </div>
                      <Button size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No rentals found. Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};