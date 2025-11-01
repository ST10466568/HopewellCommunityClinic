import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, UserPlus, Home } from 'lucide-react';
import Logo from './Logo';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import ForgotPassword from './ForgotPassword';

interface AuthPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (userData: any) => Promise<{ success: boolean; error?: string; message?: string }>;
  onForgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  isLoading: boolean;
  error: string | null;
  message: string | null;
  clearError: () => void;
  clearMessage: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({
  onLogin,
  onRegister,
  onForgotPassword,
  isLoading,
  error,
  message,
  clearError,
  clearMessage
}) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Monitor message changes
  useEffect(() => {
    console.log('AuthPage: useEffect - message changed to:', message);
    if (message && showForgotPassword) {
      console.log('AuthPage: Message is available and showing forgot password, should trigger re-render');
    }
  }, [message, showForgotPassword]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (error) clearError();
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!isLoginMode) {
      if (!formData.firstName) errors.firstName = 'First name is required';
      if (!formData.lastName) errors.lastName = 'Last name is required';
      if (!formData.phone) errors.phone = 'Phone number is required';
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
      if (!formData.address) errors.address = 'Address is required';
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      if (isLoginMode) {
        await onLogin(formData.email, formData.password);
      } else {
        const result = await onRegister(formData);
        // If registration was successful and user is now logged in, 
        // the router will automatically redirect them to the appropriate dashboard
        if (result?.success) {
          // Clear form data
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            phone: '',
            dateOfBirth: '',
            address: ''
          });
        }
      }
    } catch (err) {
      // Error handling is done in parent component
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      address: ''
    });
    setFormErrors({});
    clearError();
  };

  const handleForgotPassword = async (email: string) => {
    try {
      return await onForgotPassword(email);
    } catch (err) {
      return { success: false, error: 'Failed to send password reset email' };
    }
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    clearError();
    clearMessage();
  };

  // Show forgot password component if needed
  if (showForgotPassword) {
    console.log('AuthPage: Rendering ForgotPassword with props:', {
      isLoading,
      error,
      message,
      hasMessage: !!message
    });
    
    return (
      <ForgotPassword
        onBackToLogin={handleBackToLogin}
        onForgotPassword={handleForgotPassword}
        isLoading={isLoading}
        error={error}
        message={message}
        clearError={clearError}
        clearMessage={clearMessage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Logo size="md" variant="with-text" textSize="xl" />
          </div>
          <p className="text-muted-foreground mb-4">
            {isLoginMode ? 'Welcome back to your health journey' : 'Join our healthcare community'}
          </p>
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/'}
            className="text-muted-foreground hover:text-foreground"
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Home
          </Button>
        </div>

        {/* Auth Card */}
        <Card className="medical-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLoginMode ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLoginMode 
                ? 'Access your patient portal and manage your appointments'
                : 'Get started with comprehensive healthcare services'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Mode Toggle */}
            <div className="flex bg-muted rounded-lg p-1 mb-6">
              <button
                type="button"
                onClick={() => !isLoginMode && toggleMode()}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                  isLoginMode 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => isLoginMode && toggleMode()}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                  !isLoginMode 
                    ? 'bg-background text-foreground shadow-sm' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span>Sign Up</span>
              </button>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Registration Fields */}
              {!isLoginMode && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={formErrors.firstName ? 'border-destructive' : ''}
                        placeholder="John"
                      />
                      {formErrors.firstName && (
                        <p className="text-sm text-destructive mt-1">{formErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={formErrors.lastName ? 'border-destructive' : ''}
                        placeholder="Doe"
                      />
                      {formErrors.lastName && (
                        <p className="text-sm text-destructive mt-1">{formErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={formErrors.phone ? 'border-destructive' : ''}
                      placeholder="(555) 123-4567"
                    />
                    {formErrors.phone && (
                      <p className="text-sm text-destructive mt-1">{formErrors.phone}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className={formErrors.dateOfBirth ? 'border-destructive' : ''}
                    />
                    {formErrors.dateOfBirth && (
                      <p className="text-sm text-destructive mt-1">{formErrors.dateOfBirth}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={formErrors.address ? 'border-destructive' : ''}
                      placeholder="123 Main St, City, State 12345"
                    />
                    {formErrors.address && (
                      <p className="text-sm text-destructive mt-1">{formErrors.address}</p>
                    )}
                  </div>
                </>
              )}

              {/* Common Fields */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={formErrors.email ? 'border-destructive' : ''}
                  placeholder="john.doe@example.com"
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={formErrors.password ? 'border-destructive pr-10' : 'pr-10'}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-destructive mt-1">{formErrors.password}</p>
                )}
                {isLoginMode && (
                  <div className="text-right mt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
              </div>

              {!isLoginMode && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={formErrors.confirmPassword ? 'border-destructive' : ''}
                    placeholder="Confirm your password"
                  />
                  {formErrors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{formErrors.confirmPassword}</p>
                  )}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  isLoginMode ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;



