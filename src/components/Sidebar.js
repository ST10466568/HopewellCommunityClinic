import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose, user, role }) => {
  const location = useLocation();

  const getMenuItems = (role) => {
    switch (role) {
      case 'patient':
        return [
          { path: '/dashboard/patient', label: 'Dashboard', icon: '🏠' },
          { path: '/dashboard/patient/appointments', label: 'My Appointments', icon: '📅' },
          { path: '/dashboard/patient/profile', label: 'Profile', icon: '👤' },
        ];
      case 'doctor':
        return [
          { path: '/dashboard/doctor', label: 'Dashboard', icon: '🏠' },
          { path: '/dashboard/doctor/schedule', label: 'Schedule', icon: '📅' },
          { path: '/dashboard/doctor/patients', label: 'Patients', icon: '👥' },
          { path: '/dashboard/doctor/availability', label: 'Availability', icon: '⏰' },
        ];
      case 'nurse':
        return [
          { path: '/dashboard/nurse', label: 'Dashboard', icon: '🏠' },
          { path: '/dashboard/nurse/appointments', label: 'All Appointments', icon: '📅' },
          { path: '/dashboard/nurse/patients', label: 'Patients', icon: '👥' },
          { path: '/dashboard/nurse/walk-ins', label: 'Walk-ins', icon: '🚶' },
        ];
      case 'admin':
        return [
          { path: '/dashboard/admin', label: 'Dashboard', icon: '🏠' },
          { path: '/dashboard/admin/users', label: 'User Management', icon: '👥' },
          { path: '/dashboard/admin/services', label: 'Services', icon: '🏥' },
          { path: '/dashboard/admin/reports', label: 'Reports', icon: '📊' },
          { path: '/dashboard/admin/settings', label: 'Settings', icon: '⚙️' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems(role);

  const isActive = (path) => {
    return location.pathname === path;
  };

  return React.createElement(React.Fragment, null,
    // Overlay for mobile
    isOpen && React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden',
      onClick: onClose
    }),

    // Sidebar
    React.createElement('aside', {
      className: `fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 z-50 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`
    },
      // Header
      React.createElement('div', {
        className: 'p-6 border-b border-light'
      },
        React.createElement('div', {
          className: 'flex items-center justify-between'
        },
          React.createElement('div', {
            className: 'flex items-center gap-2'
          },
            React.createElement('span', {
              className: 'text-2xl'
            }, '💚'),
            React.createElement('span', {
              className: 'font-semibold text-primary'
            }, 'Hopewell Clinic')
          ),
          React.createElement('button', {
            className: 'p-1 rounded-md hover:bg-gray-100 lg:hidden',
            onClick: onClose
          },
            React.createElement('svg', {
              className: 'w-5 h-5',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24'
            },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M6 18L18 6M6 6l12 12'
              })
            )
          )
        )
      ),

      // Navigation menu
      React.createElement('nav', {
        className: 'p-4'
      },
        React.createElement('ul', {
          className: 'space-y-2'
        },
          menuItems.map((item, index) =>
            React.createElement('li', { key: index },
              React.createElement(Link, {
                to: item.path,
                className: `flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary text-white'
                    : 'text-primary hover:bg-gray-100'
                }`,
                onClick: () => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 1024) {
                    onClose();
                  }
                }
              },
                React.createElement('span', {
                  className: 'text-lg'
                }, item.icon),
                React.createElement('span', {
                  className: 'font-medium'
                }, item.label)
              )
            )
          )
        )
      ),

      // Footer
      React.createElement('div', {
        className: 'absolute bottom-0 left-0 right-0 p-4 border-t border-light'
      },
        React.createElement('div', {
          className: 'text-center text-sm text-secondary'
        },
          React.createElement('p', null, `Welcome, ${user?.firstName}`),
          React.createElement('p', {
            className: 'capitalize'
          }, role)
        )
      )
    )
  );
};

export default Sidebar;


