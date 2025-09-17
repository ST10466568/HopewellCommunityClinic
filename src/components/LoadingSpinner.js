import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const getSizeClass = (size) => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'md': return 'w-8 h-8';
      case 'lg': return 'w-12 h-12';
      case 'xl': return 'w-16 h-16';
      default: return 'w-8 h-8';
    }
  };

  return React.createElement('div', {
    className: `flex flex-col items-center justify-center p-8 ${className}`
  },
    React.createElement('div', {
      className: `loading-spinner ${getSizeClass(size)} mb-4`
    }),
    text && React.createElement('p', {
      className: 'text-secondary text-sm'
    }, text)
  );
};

export default LoadingSpinner;


