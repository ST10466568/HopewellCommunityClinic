import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Logo from './Logo';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  onForgotPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  isLoading: boolean;
  error: string | null;
  message: string | null;
  clearError: () => void;
  clearMessage: () => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  onBackToLogin,
  onForgotPassword,
  isLoading,
  error,
  message,
  clearError,
  clearMessage
}) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  // Debug logging for props
  console.log('ForgotPassword: Component rendered with props:', {
    isLoading,
    error,
    message,
    hasMessage: !!message,
    localMessage,
    hasLocalMessage: !!localMessage
  });

  // Monitor message changes and update local state
  useEffect(() => {
    console.log('ForgotPassword: useEffect - message changed to:', message);
    console.log('ForgotPassword: useEffect - current localMessage:', localMessage);
    if (message) {
      console.log('ForgotPassword: Message is now available, updating local state');
      setLocalMessage(message);
      console.log('ForgotPassword: localMessage set to:', message);
    } else {
      console.log('ForgotPassword: No message, clearing local state');
      setLocalMessage(null);
    }
  }, [message]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
    if (error) clearError();
  };

  const validateEmail = () => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail()) return;

    try {
      console.log('ForgotPassword: Calling onForgotPassword with email:', email);
      const result = await onForgotPassword(email);
      console.log('ForgotPassword: Received result:', result);
      
      if (result.success) {
        console.log('ForgotPassword: Success! Message should be:', result.message);
        // The message should be set in the AuthContext and will trigger the success view
      } else {
        console.log('ForgotPassword: Failed with error:', result.error);
      }
    } catch (err) {
      console.error('ForgotPassword: Error in handleSubmit:', err);
      // Error handling is done in parent component
    }
  };

  if (localMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Logo size="lg" variant="with-text" textSize="xl" />
            </div>
          </div>

          {/* Success Card */}
          <Card className="medical-card">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-600">Email Sent!</CardTitle>
              <CardDescription>
                Check your email for password reset instructions
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                {localMessage}
              </p>
              
              <div className="space-y-3">
                <Button 
                  onClick={onBackToLogin}
                  className="w-full"
                >
                  Back to Login
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Logo size="lg" variant="with-text" textSize="xl" />
          </div>
          <p className="text-muted-foreground">
            Enter your email address to reset your password
          </p>
        </div>

        {/* Forgot Password Card */}
        <Card className="medical-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <CardDescription>
              We'll send you instructions to reset your password
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={emailError ? 'border-destructive pl-10' : 'pl-10'}
                    placeholder="Enter your email address"
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-destructive mt-1">{emailError}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Send Reset Instructions'
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                onClick={onBackToLogin}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>

            {/* Return to Home */}
            <div className="mt-4 text-center">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = '/'}
                className="text-muted-foreground hover:text-foreground"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Remember your password?{' '}
            <button 
              onClick={onBackToLogin}
              className="text-primary hover:underline"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
