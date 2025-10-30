import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import ProfileModal from './ProfileModal';

const Navigation = ({ onMenuClick, user }) => {
  const { logout, getPrimaryRole } = useAuth();
  const role = getPrimaryRole();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(user);

  React.useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const handleUpdateProfile = async (userId, profileData) => {
    try {
      await authAPI.updateProfile(userId, profileData);
      setCurrentUser(prev => ({
        ...prev,
        ...profileData,
        address: profileData.address || prev.address,
        emergencyContact: profileData.emergencyContact || prev.emergencyContact
      }));
    } catch (error) {
      throw error;
    }
  };

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
          className: 'flex items-center gap-1'
        },
          React.createElement('img', {
            src: '/logo.png',
            alt: 'Hopewell Clinic Logo',
            className: 'h-24 w-12 object-contain flex-shrink-0',
            style: { height: '96px', width: '48px', maxWidth: '48px' }
          }),
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
          className: 'text-right flex items-center space-x-2'
        },
          React.createElement('div', null,
            React.createElement('p', {
              className: 'text-sm font-medium text-primary'
            }, `${currentUser?.firstName} ${currentUser?.lastName}`),
            React.createElement('p', {
              className: 'text-xs text-secondary'
            }, getRoleDisplayName(role))
          ),
          React.createElement('button', {
            className: 'h-8 w-8 p-0 flex items-center justify-center hover:bg-gray-100 rounded-md transition-colors',
            onClick: () => setShowProfileModal(true),
            title: 'Edit Profile',
            'aria-label': 'Edit Profile'
          },
            React.createElement('svg', {
              className: 'h-5 w-5 text-primary',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24'
            },
              React.createElement('path', {
                strokeLinecap: 'round',
                strokeLinejoin: 'round',
                strokeWidth: 2,
                d: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
              })
            )
          )
        ),
        React.createElement('div', {
          className: 'w-8 h-8 bg-primary rounded-full flex items-center justify-center'
        },
          React.createElement('span', {
            className: 'text-white text-sm font-medium'
          }, currentUser?.firstName?.[0]?.toUpperCase() || 'U')
        ),
        React.createElement('button', {
          className: 'btn btn-secondary btn-sm',
          onClick: handleLogout
        }, 'Logout')
      ),
      // Profile Modal
      React.createElement(ProfileModal, {
        isOpen: showProfileModal,
        onClose: () => setShowProfileModal(false),
        user: currentUser || {},
        onUpdateProfile: handleUpdateProfile,
        role: role
      })
    )
  );
};

export default Navigation;


