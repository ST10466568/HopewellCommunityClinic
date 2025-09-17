import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, isLoading, hasAnyRole } = useAuth();

  if (isLoading) {
    return React.createElement(LoadingSpinner);
  }

  if (!isAuthenticated) {
    return React.createElement(Navigate, { to: '/auth', replace: true });
  }

  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return React.createElement(Navigate, { to: '/unauthorized', replace: true });
  }

  return children;
};

// Public Route component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, getPrimaryRole } = useAuth();

  if (isLoading) {
    return React.createElement(LoadingSpinner);
  }

  if (isAuthenticated) {
    const primaryRole = getPrimaryRole();
    const dashboardPath = getDashboardPath(primaryRole);
    return React.createElement(Navigate, { to: dashboardPath, replace: true });
  }

  return children;
};

// Get dashboard path based on user role
const getDashboardPath = (role) => {
  switch (role) {
    case 'patient':
      return '/patient-dashboard';
    case 'doctor':
      return '/doctor-dashboard';
    case 'nurse':
      return '/nurse-dashboard';
    case 'admin':
      return '/admin-dashboard';
    default:
      return '/patient-dashboard';
  }
};

// Unauthorized page component
const UnauthorizedPage = () => {
  return React.createElement('div', {
    className: 'min-h-screen flex items-center justify-center bg-light'
  }, React.createElement('div', {
    className: 'text-center'
  }, React.createElement('h1', {
    className: 'text-4xl font-bold text-error mb-4'
  }, '403'), React.createElement('h2', {
    className: 'text-2xl font-semibold text-primary mb-4'
  }, 'Access Denied'), React.createElement('p', {
    className: 'text-secondary mb-6'
  }, 'You do not have permission to access this page.'), React.createElement('button', {
    className: 'btn btn-primary',
    onClick: () => window.history.back()
  }, 'Go Back')));
};

// Main App Routes component
const AppRoutes = () => {
  return React.createElement(Router, null,
    React.createElement(Routes, null,
      // Public routes
      React.createElement(Route, {
        path: '/',
        element: React.createElement(PublicRoute, null,
          React.createElement(LandingPage)
        )
      }),
      React.createElement(Route, {
        path: '/auth',
        element: React.createElement(PublicRoute, null,
          React.createElement(AuthPage)
        )
      }),

      // Protected routes with layout
      React.createElement(Route, {
        path: '/patient-dashboard',
        element: React.createElement(ProtectedRoute, { allowedRoles: ['patient'] },
          React.createElement(Layout, null,
            React.createElement(PatientDashboard)
          )
        )
      }),
      React.createElement(Route, {
        path: '/doctor-dashboard',
        element: React.createElement(ProtectedRoute, { allowedRoles: ['doctor'] },
          React.createElement(Layout, null,
            React.createElement(DoctorDashboard)
          )
        )
      }),
      React.createElement(Route, {
        path: '/nurse-dashboard',
        element: React.createElement(ProtectedRoute, { allowedRoles: ['nurse'] },
          React.createElement(Layout, null,
            React.createElement(NurseDashboard)
          )
        )
      }),
      React.createElement(Route, {
        path: '/admin-dashboard',
        element: React.createElement(ProtectedRoute, { allowedRoles: ['admin'] },
          React.createElement(Layout, null,
            React.createElement(AdminDashboard)
          )
        )
      }),

      // Unauthorized page
      React.createElement(Route, {
        path: '/unauthorized',
        element: React.createElement(UnauthorizedPage)
      }),

      // Catch all route - redirect to home
      React.createElement(Route, {
        path: '*',
        element: React.createElement(Navigate, { to: '/', replace: true })
      })
    )
  );
};

// Main App component
const App = () => {
  return React.createElement(AuthProvider, null,
    React.createElement(AppRoutes)
  );
};

export default App;
