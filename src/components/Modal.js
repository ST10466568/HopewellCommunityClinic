import React, { useEffect } from 'react';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  className = '' 
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getSizeClass = (size) => {
    switch (size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case '3xl': return 'max-w-3xl';
      case '4xl': return 'max-w-4xl';
      case 'full': return 'max-w-full mx-4';
      default: return 'max-w-md';
    }
  };

  return React.createElement('div', {
    className: 'modal-overlay',
    onClick: (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }
  },
    React.createElement('div', {
      className: `modal ${getSizeClass(size)} ${className}`
    },
      // Header
      (title || showCloseButton) && React.createElement('div', {
        className: 'modal-header'
      },
        title && React.createElement('h2', {
          className: 'modal-title'
        }, title),
        showCloseButton && React.createElement('button', {
          className: 'modal-close',
          onClick: onClose,
          'aria-label': 'Close modal'
        }, '×')
      ),

      // Body
      React.createElement('div', {
        className: 'modal-body'
      }, children)
    )
  );
};

export default Modal;


