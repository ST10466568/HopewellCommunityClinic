import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './Navigation';
import Sidebar from './Sidebar';

const Layout = ({ children }) => {
  const { user, getPrimaryRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return React.createElement('div', {
    className: 'min-h-screen bg-light'
  },
    // Sidebar
    React.createElement(Sidebar, {
      isOpen: sidebarOpen,
      onClose: () => setSidebarOpen(false),
      user: user,
      role: getPrimaryRole()
    }),

    // Main content area
    React.createElement('div', {
      className: `transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`
    },
      // Top navigation
      React.createElement(Navigation, {
        onMenuClick: toggleSidebar,
        user: user
      }),

      // Page content
      React.createElement('main', {
        className: 'p-6'
      }, children)
    )
  );
};

export default Layout;


