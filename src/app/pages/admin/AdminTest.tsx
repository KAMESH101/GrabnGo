import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { CheckCircle, ShieldCheck } from 'lucide-react';

export const AdminTest: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <CardTitle className="text-3xl text-green-600">Admin Module Loaded Successfully</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-6 h-6 text-green-600" />
              <h3 className="font-semibold text-lg">Route Configuration: Working ✓</h3>
            </div>
            <p className="text-sm text-gray-600">
              This page confirms that admin routes are properly registered and accessible.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Current Session Info:</h3>
            <div className="bg-gray-50 border rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">User ID:</span>
                <span className="font-mono">{user?.id || 'Not logged in'}</span>
                
                <span className="text-gray-600">Name:</span>
                <span>{user?.name || 'N/A'}</span>
                
                <span className="text-gray-600">Email:</span>
                <span>{user?.email || 'N/A'}</span>
                
                <span className="text-gray-600">Role:</span>
                <span className="font-semibold text-indigo-600">{user?.role || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Admin Routes Available:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">/admin/login</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">/admin/dashboard</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">/admin/users/customers</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">/admin/users/owners</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">/admin/products</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">/admin/bookings</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">/admin/locations</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">/admin/data-consistency</code>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <code className="bg-gray-100 px-2 py-1 rounded">/admin/mock-account-creation</code>
              </li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Next Steps:</h3>
            <ol className="list-decimal list-inside text-sm space-y-1 text-gray-700">
              <li>Navigate to <code className="bg-white px-1 rounded">/admin/login</code></li>
              <li>Use credentials: <code className="bg-white px-1 rounded">admin@grabngo.com</code> / <code className="bg-white px-1 rounded">admin123</code></li>
              <li>Access admin dashboard and data pages</li>
              <li>This test route can be removed after verification</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
