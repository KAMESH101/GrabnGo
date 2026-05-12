import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/BackButton';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../context/AuthContext';
import { Store, Lock, Eye, EyeOff, Mail, User } from 'lucide-react';
import { toast } from 'sonner';
import { chennaiLocalities } from '../../data/mockData';
import { validatePasswordStrength, passwordsMatch } from '../../utils/passwordUtils';

export const OwnerSignup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    locality: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Please enter your name');
      return;
    }
    if (!formData.email) {
      toast.error('Please enter your email');
      return;
    }
    if (!formData.locality) {
      toast.error('Please select your locality');
      return;
    }

    const passwordValidation = validatePasswordStrength(formData.password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0]);
      return;
    }
    if (!passwordsMatch(formData.password, formData.confirmPassword)) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        activeRole: 'owner',
        role: 'owner',
        city: 'Chennai',
        locality: formData.locality,
      });

      toast.success('Owner account created successfully!');
      navigate('/owner/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <BackButton to="/" label="Back to Home" className="mb-4" />
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Create Owner Account
            </CardTitle>
            <CardDescription>Join as a rental provider on GrabNGo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Owner Name / Business Name
                  </Label>
                  <Input id="name" name="name" type="text" placeholder="Enter name" value={formData.name} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input id="email" name="email" type="email" placeholder="Enter email" value={formData.email} onChange={handleChange} required />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center gap-2"><Lock className="w-4 h-4" />Password</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={formData.password} onChange={handleChange} required className="pr-10" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters with uppercase, lowercase, and numbers</p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="flex items-center gap-2"><Lock className="w-4 h-4" />Confirm Password</Label>
                <div className="relative">
                  <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleChange} required className="pr-10" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label>Pickup Locality (Chennai)</Label>
                <Select value={formData.locality} onValueChange={(value) => setFormData({ ...formData, locality: value })}>
                  <SelectTrigger><SelectValue placeholder="Select locality" /></SelectTrigger>
                  <SelectContent>
                    {chennaiLocalities.map((loc) => (
                      <SelectItem key={loc.name} value={loc.name}>{loc.name} ({loc.area})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">This will be the default pickup location for your listings</p>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Owner Account'}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">Already have an account?{' '}<Link to="/owner/login" className="text-green-600 hover:underline">Login</Link></p>
              <p className="text-sm text-gray-600"><Link to="/customer/signup" className="text-indigo-600 hover:underline">Are you a Customer? Signup here</Link></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};