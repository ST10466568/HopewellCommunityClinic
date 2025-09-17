import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Navigation = ({ onMenuClick, user }) => {
  const { logout, getPrimaryRole } = useAuth();
  const role = getPrimaryRole();

  const handleLogout = async () => {
    await logout();
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'patient': return 'Patient';
      case 'doctor': return 'Doctor';
      case 'nurse': return 'Nurse';
      case 'admin': return 'Administrator';
      default: return 'User';
    }
  };

  return React.createElement('nav', {
    className: 'bg-white shadow-md border-b border-light'
  },
    React.createElement('div', {
      className: 'px-6 py-4 flex items-center justify-between'
    },
      // Left side - Menu button and title
      React.createElement('div', {
        className: 'flex items-center gap-4'
      },
        React.createElement('button', {
          className: 'p-2 rounded-md hover:bg-gray-100 transition-colors',
          onClick: onMenuClick,
          'aria-label': 'Toggle menu'
        },
          React.createElement('svg', {
            className: 'w-6 h-6 text-primary',
            fill: 'none',
            stroke: 'currentColor',
            viewBox: '0 0 24 24'
          },
            React.createElement('path', {
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
              d: 'M4 6h16M4 12h16M4 18h16'
            })
          )
        ),
        React.createElement('div', {
          className: 'flex items-center gap-2'
        },
          React.createElement('span', {
            className: 'text-2xl'
          }, '💚'),
          React.createElement('h1', {
            className: 'text-xl font-semibold text-primary'
          }, 'Hopewell Clinic')
        )
      ),

      // Right side - User info and logout
      React.createElement('div', {
        className: 'flex items-center gap-4'
      },
        React.createElement('div', {
          className: 'text-right'
        },
          React.createElement('p', {
            className: 'text-sm font-medium text-primary'
          }, `${user?.firstName} ${user?.lastName}`),
          React.createElement('p', {
            className: 'text-xs text-secondary'
          }, getRoleDisplayName(role))
        ),
        React.createElement('div', {
          className: 'w-8 h-8 bg-primary rounded-full flex items-center justify-center'
        },
          React.createElement('span', {
            className: 'text-white text-sm font-medium'
          }, user?.firstName?.[0]?.toUpperCase() || 'U')
        ),
        React.createElement('button', {
          className: 'btn btn-secondary btn-sm',
          onClick: handleLogout
        }, 'Logout')
      )
    )
  );
};

export default Navigation;


