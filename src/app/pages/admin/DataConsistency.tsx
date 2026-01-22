import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { AdminNavbar } from '../../components/admin/AdminNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { getAllUsers, getAllProducts, getAllBookings } from '../../services/database';
import { User, Product, Booking } from '../../types';

interface DataIssue {
  type: 'error' | 'warning';
  category: string;
  description: string;
  affectedId?: string;
  details?: string;
}

export const DataConsistency: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState<DataIssue[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    runConsistencyCheck();
  }, [user, navigate]);

  const runConsistencyCheck = () => {
    setIsChecking(true);
    const foundIssues: DataIssue[] = [];

    const users = getAllUsers();
    const products = getAllProducts();
    const bookings = getAllBookings();

    // Check 1: Products without pickup location
    products.forEach(product => {
      if (!product.pickupLocality || !product.pickupAddress) {
        foundIssues.push({
          type: 'error',
          category: 'Product Location',
          description: `Product "${product.title}" missing pickup location`,
          affectedId: product.id,
          details: 'Owner needs to add pickup location details'
        });
      }

      if (!product.pickupLat || !product.pickupLng) {
        foundIssues.push({
          type: 'error',
          category: 'Product Coordinates',
          description: `Product "${product.title}" missing GPS coordinates`,
          affectedId: product.id,
          details: 'Pickup location not geocoded properly'
        });
      }

      // Check if coordinates are within Chennai metropolitan area
      // Chennai bounds: roughly 12.8° to 13.3°N, 79.9° to 80.3°E
      if (product.pickupLat && product.pickupLng) {
        if (
          product.pickupLat < 12.8 || product.pickupLat > 13.3 ||
          product.pickupLng < 79.9 || product.pickupLng > 80.3
        ) {
          foundIssues.push({
            type: 'warning',
            category: 'Location Validation',
            description: `Product "${product.title}" location outside Chennai area`,
            affectedId: product.id,
            details: `Coordinates: ${product.pickupLat.toFixed(4)}, ${product.pickupLng.toFixed(4)}`
          });
        }
      }
    });

    // Check 2: Bookings without valid product reference
    bookings.forEach(booking => {
      const product = products.find(p => p.id === booking.productId);
      if (!product) {
        foundIssues.push({
          type: 'error',
          category: 'Booking Reference',
          description: `Booking ${booking.id} references non-existent product`,
          affectedId: booking.id,
          details: `Product ID: ${booking.productId}`
        });
      }
    });

    // Check 3: Bookings without valid customer reference
    bookings.forEach(booking => {
      const customer = users.find(u => u.id === booking.customerId);
      if (!customer) {
        foundIssues.push({
          type: 'error',
          category: 'Booking Reference',
          description: `Booking ${booking.id} references non-existent customer`,
          affectedId: booking.id,
          details: `Customer ID: ${booking.customerId}`
        });
      }
    });

    // Check 4: Bookings without valid owner reference
    bookings.forEach(booking => {
      const owner = users.find(u => u.id === booking.ownerId);
      if (!owner) {
        foundIssues.push({
          type: 'error',
          category: 'Booking Reference',
          description: `Booking ${booking.id} references non-existent owner`,
          affectedId: booking.id,
          details: `Owner ID: ${booking.ownerId}`
        });
      }
    });

    // Check 5: Products with invalid owner reference
    products.forEach(product => {
      const owner = users.find(u => u.id === product.ownerId);
      if (!owner) {
        foundIssues.push({
          type: 'error',
          category: 'Product Owner',
          description: `Product "${product.title}" has invalid owner reference`,
          affectedId: product.id,
          details: `Owner ID: ${product.ownerId}`
        });
      } else if (owner.role !== 'owner') {
        foundIssues.push({
          type: 'error',
          category: 'Product Owner',
          description: `Product "${product.title}" owner has wrong role`,
          affectedId: product.id,
          details: `User ${owner.name} has role: ${owner.role}`
        });
      }
    });

    // Check 6: Customers without verified location
    const customersWithoutLocation = users.filter(
      u => u.role === 'customer' && !u.verifiedLocation
    );
    if (customersWithoutLocation.length > 0) {
      foundIssues.push({
        type: 'warning',
        category: 'Customer Location',
        description: `${customersWithoutLocation.length} customers without verified location`,
        details: 'These customers cannot make bookings'
      });
    }

    // Check 7: Owners without any products
    const ownersWithoutProducts = users.filter(u => {
      if (u.role !== 'owner') return false;
      return products.filter(p => p.ownerId === u.id).length === 0;
    });
    if (ownersWithoutProducts.length > 0) {
      foundIssues.push({
        type: 'warning',
        category: 'Owner Products',
        description: `${ownersWithoutProducts.length} owners have no products listed`,
        details: 'These owner accounts are inactive'
      });
    }

    // Check 8: Products with no images
    products.forEach(product => {
      if (!product.images || product.images.length === 0) {
        foundIssues.push({
          type: 'warning',
          category: 'Product Images',
          description: `Product "${product.title}" has no images`,
          affectedId: product.id,
          details: 'Product will not display properly to customers'
        });
      }
    });

    setIssues(foundIssues);
    setIsChecking(false);
  };

  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Consistency Check</h1>
            <p className="text-gray-600 mt-1">Detect data issues and inconsistencies</p>
          </div>
          <Button
            onClick={runConsistencyCheck}
            disabled={isChecking}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            Re-check
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Issues</p>
                  <p className="text-2xl font-bold mt-1">{issues.length}</p>
                </div>
                {issues.length === 0 ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Errors</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">{errors.length}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Warnings</p>
                  <p className="text-2xl font-bold mt-1 text-yellow-600">{warnings.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Issues List */}
        {issues.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-xl font-medium text-gray-900">All Clear!</p>
                <p className="text-gray-600 mt-2">No data consistency issues found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Errors */}
            {errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    Errors ({errors.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {errors.map((issue, idx) => (
                      <div key={idx} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                {issue.category}
                              </span>
                              {issue.affectedId && (
                                <code className="text-xs bg-white px-2 py-1 rounded">
                                  {issue.affectedId}
                                </code>
                              )}
                            </div>
                            <p className="mt-2 text-sm font-medium text-gray-900">
                              {issue.description}
                            </p>
                            {issue.details && (
                              <p className="mt-1 text-xs text-gray-600">{issue.details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="w-5 h-5" />
                    Warnings ({warnings.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {warnings.map((issue, idx) => (
                      <div key={idx} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                                {issue.category}
                              </span>
                              {issue.affectedId && (
                                <code className="text-xs bg-white px-2 py-1 rounded">
                                  {issue.affectedId}
                                </code>
                              )}
                            </div>
                            <p className="mt-2 text-sm font-medium text-gray-900">
                              {issue.description}
                            </p>
                            {issue.details && (
                              <p className="mt-1 text-xs text-gray-600">{issue.details}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
