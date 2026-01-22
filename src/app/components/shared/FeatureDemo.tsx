import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CreditCard, MapPin, Camera, Trash2, Bell, Shield, Database, CheckCircle } from 'lucide-react';

export const FeatureDemo: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            Payment & Booking Features (Add-on)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Date & Time Selection:</strong> Granular booking with start/end dates and times (15-min intervals)</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Automatic Price Calculation:</strong> Real-time pricing based on duration</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>GST Calculation:</strong> 18% GST applied automatically with price breakdown</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Security Deposit:</strong> Separate refundable deposit handling</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Razorpay Integration:</strong> Demo payment gateway (test mode)</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>SMS & Email Notifications:</strong> Automated confirmations via demo APIs</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Owner Approval Workflow:</strong> Pending → Owner Review → Approved/Rejected</span>
            </p>
          </div>
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p><strong>Demo Mode:</strong> Check browser console for Razorpay API calls and notification logs</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-indigo-600" />
            Map-based Pickup & Navigation (Add-on)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Google Maps Integration:</strong> Static map with pickup location marker</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Distance Calculation:</strong> Shows distance from customer's location</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Get Directions:</strong> Opens Google Maps with navigation</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Chennai Localities:</strong> All products have lat/lng coordinates</span>
            </p>
          </div>
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p><strong>Demo Mode:</strong> Static maps shown. In production, use real Google Maps API key for interactive maps</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-indigo-600" />
            Customer Photo Proof System (Add-on)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Live Camera Capture:</strong> Owner can capture customer photo at pickup</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Gallery Upload Disabled:</strong> Only live camera allowed (security)</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>S3 Storage:</strong> Photos stored in demo AWS S3 bucket</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Booking Linkage:</strong> Each photo linked to specific booking ID</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Access Control:</strong> Only owner/admin can access during active rental</span>
            </p>
          </div>
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p><strong>Demo Mode:</strong> Photos stored in memory. Check console for S3 upload logs</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-600" />
            Auto-deletion After Return (Add-on)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Rental Completion Trigger:</strong> Auto-deletes photo when owner marks rental complete</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Payment Finalization:</strong> Deposit refund processed automatically</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>S3 Photo Deletion:</strong> Permanently removes from storage</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Database Cleanup:</strong> Photo reference removed from booking</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span><strong>Audit Trail:</strong> Deletion event logged with timestamp</span>
            </p>
          </div>
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <p><strong>Privacy Compliance:</strong> Photos auto-deleted after use. Audit logs maintained for compliance.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            Complete Workflow Example
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <p><strong>Customer Books:</strong> Selects dates/times → Razorpay payment → SMS/Email sent</p>
                <p className="text-xs text-gray-600 mt-1">Status: Pending (waiting owner approval)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <p><strong>Owner Approves:</strong> Reviews booking → Approves → Customer notified</p>
                <p className="text-xs text-gray-600 mt-1">Status: Confirmed (ready for pickup)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <p><strong>Pickup & Photo:</strong> Owner captures customer photo → Uploads to S3 → Audit log created</p>
                <p className="text-xs text-gray-600 mt-1">Status: Active (rental in progress)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">4</div>
              <div>
                <p><strong>Return & Complete:</strong> Owner completes → Photo auto-deleted → Deposit refunded → Email sent</p>
                <p className="text-xs text-gray-600 mt-1">Status: Completed (all done)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div className="text-sm">
              <p className="mb-2"><strong>Important Notes:</strong></p>
              <ul className="space-y-1 text-gray-700">
                <li>• All external services (Razorpay, SMS, Email, S3) are in <strong>demo mode</strong></li>
                <li>• Check browser console for detailed API call logs</li>
                <li>• Replace demo keys with production keys before going live</li>
                <li>• Customer photos are privacy-protected with auto-deletion</li>
                <li>• Audit trails maintained for compliance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
