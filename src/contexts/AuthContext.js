import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  message: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  FORGOT_PASSWORD_START: 'FORGOT_PASSWORD_START',
  FORGOT_PASSWORD_SUCCESS: 'FORGOT_PASSWORD_SUCCESS',
  FORGOT_PASSWORD_FAILURE: 'FORGOT_PASSWORD_FAILURE',
  RESET_PASSWORD_START: 'RESET_PASSWORD_START',
  RESET_PASSWORD_SUCCESS: 'RESET_PASSWORD_SUCCESS',
  RESET_PASSWORD_FAILURE: 'RESET_PASSWORD_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_MESSAGE: 'CLEAR_MESSAGE',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
    case AUTH_ACTIONS.FORGOT_PASSWORD_START:
    case AUTH_ACTIONS.RESET_PASSWORD_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.FORGOT_PASSWORD_SUCCESS:
    case AUTH_ACTIONS.RESET_PASSWORD_SUCCESS:
      console.log('AuthContext Reducer: FORGOT_PASSWORD_SUCCESS/RESET_PASSWORD_SUCCESS action received');
      console.log('AuthContext Reducer: Payload:', action.payload);
      return {
        ...state,
        isLoading: false,
        error: null,
        message: action.payload.message,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.LOAD_USER_FAILURE:
    case AUTH_ACTIONS.FORGOT_PASSWORD_FAILURE:
    case AUTH_ACTIONS.RESET_PASSWORD_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
        message: null,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        message: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        // Don't clear message when clearing error
      };

    case AUTH_ACTIONS.CLEAR_MESSAGE:
      return {
        ...state,
        message: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user from localStorage on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          // Validate token format (basic check)
          if (token.length > 10 && user.id) {
            dispatch({
              type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
              payload: { user, token },
            });
          } else {
            throw new Error('Invalid token or user data');
          }
        } catch (error) {
          // Invalid user data in localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          dispatch({
            type: AUTH_ACTIONS.LOAD_USER_FAILURE,
            payload: 'Invalid user data',
          });
        }
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOAD_USER_FAILURE,
          payload: 'No user data found',
        });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (credentials) => {
    console.log('🚀 AuthContext: Starting login process', credentials);
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      console.log('📞 AuthContext: Calling authAPI.login');
      const response = await authAPI.login(credentials);
      console.log('📥 AuthContext: Received response', response);
      
      const { token, user } = response;

      // Store in localStorage
      console.log('💾 AuthContext: Storing in localStorage');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('✅ AuthContext: Dispatching LOGIN_SUCCESS');
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      console.error('❌ AuthContext: Login error', error);
      const errorMessage = error.error || error.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const response = await authAPI.register(userData);
      
      // If registration is successful, automatically log the user in
      if (response.token && response.user) {
        // Store in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: { user: response.user, token: response.token },
        });

        return { success: true, message: response.message || 'Registration successful! You are now logged in.' };
      } else {
        // If no token/user returned, just show success message
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: response,
        });

        return { success: true, message: response.message || 'Registration successful! Please login.' };
      }
    } catch (error) {
      const errorMessage = error.error || error.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // Even if logout API fails, we should still clear local state
      console.error('Logout API error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear all shift schedule data from localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('shiftSchedule_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('🧹 Cleared shift schedule data from localStorage');

      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    console.log('AuthContext: forgotPassword called with email:', email);
    dispatch({ type: AUTH_ACTIONS.FORGOT_PASSWORD_START });

    try {
      const response = await authAPI.forgotPassword(email);
      console.log('AuthContext: Received response:', response);
      
      dispatch({
        type: AUTH_ACTIONS.FORGOT_PASSWORD_SUCCESS,
        payload: { message: response.message },
      });
      
      console.log('AuthContext: Dispatched FORGOT_PASSWORD_SUCCESS with message:', response.message);
      return { success: true, message: response.message };
    } catch (error) {
      console.error('AuthContext: Forgot password error:', error);
      const errorMessage = error.error || error.message || 'Failed to send password reset email';
      dispatch({
        type: AUTH_ACTIONS.FORGOT_PASSWORD_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Reset password function
  const resetPassword = async (token, newPassword) => {
    dispatch({ type: AUTH_ACTIONS.RESET_PASSWORD_START });

    try {
      const response = await authAPI.resetPassword(token, newPassword);
      dispatch({
        type: AUTH_ACTIONS.RESET_PASSWORD_SUCCESS,
        payload: { message: response.message },
      });
      return { success: true, message: response.message };
    } catch (error) {
      const errorMessage = error.error || error.message || 'Failed to reset password';
      dispatch({
        type: AUTH_ACTIONS.RESET_PASSWORD_FAILURE,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  // Clear message function
  const clearMessage = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_MESSAGE });
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return state.user?.roles?.includes(role) || false;
  }, [state.user?.roles]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback((roles) => {
    return roles.some(role => state.user?.roles?.includes(role));
  }, [state.user?.roles]);

  // Get user's primary role (first role in the array)
  const getPrimaryRole = useCallback(() => {
    return state.user?.roles?.[0] || null;
  }, [state.user?.roles]);

  const value = {
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    clearError,
    clearMessage,
    hasRole,
    hasAnyRole,
    getPrimaryRole,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
