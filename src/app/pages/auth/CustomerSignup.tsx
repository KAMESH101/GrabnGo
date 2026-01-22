import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/BackButton';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { UserPlus, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export const CustomerSignup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    otp: '',
  });
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 [CUSTOMER SIGNUP] Form submitted with data:', {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: 'customer',
      city: 'Chennai'
    });
    
    try {
      await signup({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'customer',
        city: 'Chennai',
      });
      toast.success('Account created successfully!');
      toast.info('You will be prompted to set your location next');
      console.log('✅ [CUSTOMER SIGNUP] Account created, navigating to home...');
      navigate('/customer/home');
    } catch (error) {
      console.error('❌ [CUSTOMER SIGNUP] Signup failed:', error);
      toast.error('Signup failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <BackButton to="/" label="Back to Home" className="mb-4" />
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Create Customer Account</CardTitle>
            <CardDescription>Join GrabNGo to start renting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
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
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
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
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm">
                  Send OTP
                </Button>
                <Input
                  name="otp"
                  type="text"
                  placeholder="Enter OTP"
                  value={formData.otp}
                  onChange={handleChange}
                  className="flex-1"
                />
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
                <Label>City</Label>
                <Input value="Chennai" disabled className="mb-3" />
                <p className="text-xs text-gray-500 mb-3">Currently available in Chennai only</p>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/customer/login" className="text-indigo-600 hover:underline">
                  Login
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                <Link to="/owner/signup" className="text-green-600 hover:underline">
                  Are you an Owner? Signup here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};