import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/BackButton';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../context/AuthContext';
import { Store, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { chennaiLocalities } from '../../data/mockData';

export const OwnerSignup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    otp: '',
    locality: '',
  });
  const [kycFiles, setKycFiles] = useState({
    aadhaar: null as File | null,
    pan: null as File | null,
    drivingLicense: null as File | null,
  });
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof kycFiles) => {
    if (e.target.files && e.target.files[0]) {
      setKycFiles({ ...kycFiles, [type]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [OWNER SIGNUP] Form submitted with data:', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: 'owner',
      city: 'Chennai',
      locality: formData.locality,
      kycDocuments: {
        aadhaar: kycFiles.aadhaar?.name,
        pan: kycFiles.pan?.name,
        drivingLicense: kycFiles.drivingLicense?.name,
      }
    });
    
    try {
      await signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'owner',
        city: 'Chennai',
        locality: formData.locality,
        kycDocuments: {
          aadhaar: kycFiles.aadhaar?.name,
          pan: kycFiles.pan?.name,
          drivingLicense: kycFiles.drivingLicense?.name,
        },
      });
      toast.success('Owner account created! KYC under review');
      console.log('✅ [OWNER SIGNUP] Account created, navigating to dashboard...');
      navigate('/owner/dashboard');
    } catch (error) {
      console.error('❌ [OWNER SIGNUP] Signup failed:', error);
      toast.error('Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <BackButton to="/" label="Back to Home" className="mb-4" />
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create Owner Account</CardTitle>
            <CardDescription>Join as a rental provider on GrabNGo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Owner Name / Business Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="Enter mobile number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>OTP</Label>
                    <Input
                      name="otp"
                      type="text"
                      placeholder="Enter OTP"
                      value={formData.otp}
                      onChange={handleChange}
                    />
                  </div>
                  <Button type="button" variant="outline">
                    Send OTP
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <Label>Pickup Locality (Chennai)</Label>
                <Select value={formData.locality} onValueChange={(value) => setFormData({ ...formData, locality: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select locality" />
                  </SelectTrigger>
                  <SelectContent>
                    {chennaiLocalities.map((loc) => (
                      <SelectItem key={loc.name} value={loc.name}>
                        {loc.name} ({loc.area})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-3">KYC Documents Upload</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="aadhaar" className="flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Aadhaar Card {kycFiles.aadhaar && <span className="text-xs text-green-600">✓ Uploaded</span>}
                    </Label>
                    <Input
                      id="aadhaar"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'aadhaar')}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pan" className="flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      PAN Card {kycFiles.pan && <span className="text-xs text-green-600">✓ Uploaded</span>}
                    </Label>
                    <Input
                      id="pan"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'pan')}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dl" className="flex items-center gap-2 cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Driving License {kycFiles.drivingLicense && <span className="text-xs text-green-600">✓ Uploaded</span>}
                    </Label>
                    <Input
                      id="dl"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(e, 'drivingLicense')}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                Create Owner Account
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/owner/login" className="text-green-600 hover:underline">
                  Login
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                <Link to="/customer/signup" className="text-indigo-600 hover:underline">
                  Are you a Customer? Signup here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};