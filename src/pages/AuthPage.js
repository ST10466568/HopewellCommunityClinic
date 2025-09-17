import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import FormInput from '../components/forms/FormInput';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthPage = () => {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear errors when switching modes
  useEffect(() => {
    clearError();
    setFormErrors({});
  }, [isLoginMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Common validations
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

    // Registration specific validations
    if (!isLoginMode) {
      if (!formData.firstName) {
        errors.firstName = 'First name is required';
      }

      if (!formData.lastName) {
        errors.lastName = 'Last name is required';
      }

      if (!formData.phone) {
        errors.phone = 'Phone number is required';
      }

      if (!formData.dateOfBirth) {
        errors.dateOfBirth = 'Date of birth is required';
      } else {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        if (birthDate >= today) {
          errors.dateOfBirth = 'Date of birth must be in the past';
        }
      }

      if (!formData.address) {
        errors.address = 'Address is required';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLoginMode) {
        const result = await login({
          email: formData.email,
          password: formData.password
        });

        if (result.success) {
          // Redirect will be handled by the router
        } else {
          setFormErrors({ submit: result.error });
        }
      } else {
        const result = await register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          address: formData.address
        });

        if (result.success) {
          // Show success message and switch to login
          alert(result.message || 'Registration successful! Please login.');
          setIsLoginMode(true);
          setFormData({
            email: formData.email,
            password: '',
            firstName: '',
            lastName: '',
            phone: '',
            dateOfBirth: '',
            address: '',
            confirmPassword: ''
          });
        } else {
          setFormErrors({ submit: result.error });
        }
      }
    } catch (err) {
      setFormErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      address: '',
      confirmPassword: ''
    });
    setFormErrors({});
  };

  if (isLoading) {
    return React.createElement(LoadingSpinner, {
      size: 'lg',
      text: 'Loading...'
    });
  }

  return React.createElement('div', {
    className: 'min-h-screen bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center p-4'
  },
    React.createElement('div', {
      className: 'w-full max-w-md'
    },
      // Logo and title
      React.createElement('div', {
        className: 'text-center mb-8'
      },
        React.createElement('div', {
          className: 'w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-4'
        }, '💚'),
        React.createElement('h1', {
          className: 'text-3xl font-bold text-white mb-2'
        }, 'Hopewell Clinic'),
        React.createElement('p', {
          className: 'text-white opacity-90'
        }, isLoginMode ? 'Welcome back!' : 'Create your account')
      ),

      // Auth form
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-xl p-8'
      },
        React.createElement('form', {
          onSubmit: handleSubmit
        },
          // Error message
          (error || formErrors.submit) && React.createElement('div', {
            className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6'
          }, error || formErrors.submit),

          // Registration fields
          !isLoginMode && React.createElement(React.Fragment, null,
            React.createElement('div', {
              className: 'grid grid-cols-2 gap-4'
            },
              React.createElement(FormInput, {
                label: 'First Name',
                name: 'firstName',
                value: formData.firstName,
                onChange: handleInputChange,
                error: formErrors.firstName,
                required: true
              }),
              React.createElement(FormInput, {
                label: 'Last Name',
                name: 'lastName',
                value: formData.lastName,
                onChange: handleInputChange,
                error: formErrors.lastName,
                required: true
              })
            ),
            React.createElement(FormInput, {
              label: 'Phone Number',
              name: 'phone',
              type: 'tel',
              value: formData.phone,
              onChange: handleInputChange,
              error: formErrors.phone,
              required: true
            }),
            React.createElement(FormInput, {
              label: 'Date of Birth',
              name: 'dateOfBirth',
              type: 'date',
              value: formData.dateOfBirth,
              onChange: handleInputChange,
              error: formErrors.dateOfBirth,
              required: true
            }),
            React.createElement(FormInput, {
              label: 'Address',
              name: 'address',
              value: formData.address,
              onChange: handleInputChange,
              error: formErrors.address,
              required: true
            })
          ),

          // Common fields
          React.createElement(FormInput, {
            label: 'Email',
            name: 'email',
            type: 'email',
            value: formData.email,
            onChange: handleInputChange,
            error: formErrors.email,
            required: true
          }),
          React.createElement(FormInput, {
            label: 'Password',
            name: 'password',
            type: 'password',
            value: formData.password,
            onChange: handleInputChange,
            error: formErrors.password,
            required: true
          }),

          // Confirm password for registration
          !isLoginMode && React.createElement(FormInput, {
            label: 'Confirm Password',
            name: 'confirmPassword',
            type: 'password',
            value: formData.confirmPassword,
            onChange: handleInputChange,
            error: formErrors.confirmPassword,
            required: true
          }),

          // Submit button
          React.createElement('button', {
            type: 'submit',
            className: 'btn btn-primary w-full',
            disabled: isSubmitting
          },
            isSubmitting && React.createElement('div', {
              className: 'loading-spinner w-4 h-4 mr-2'
            }),
            isSubmitting ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')
          )
        ),

        // Toggle mode
        React.createElement('div', {
          className: 'mt-6 text-center'
        },
          React.createElement('p', {
            className: 'text-secondary'
          },
            isLoginMode ? "Don't have an account? " : "Already have an account? ",
            React.createElement('button', {
              type: 'button',
              className: 'text-primary hover:underline font-medium',
              onClick: toggleMode
            }, isLoginMode ? 'Sign up' : 'Sign in')
          )
        )
      ),

      // Back to home link
      React.createElement('div', {
        className: 'text-center mt-6'
      },
        React.createElement('a', {
          href: '/',
          className: 'text-white opacity-75 hover:opacity-100 transition-opacity'
        }, '← Back to Home')
      )
    )
  );
};

export default AuthPage;
