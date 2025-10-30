import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'icon-only' | 'with-text';
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true,
  textSize = 'lg',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-20 w-20',
    xl: 'h-24 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const displayText = variant !== 'icon-only' && (variant === 'with-text' || (variant === 'default' && showText));

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <img 
        src="/logo.png" 
        alt="Hopewell Clinic Logo"
        className={`${sizeClasses[size]} object-contain flex-shrink-0`}
      />
      {displayText && (
        <span className={`font-bold text-foreground ${textSizeClasses[textSize]}`}>
          Hopewell {variant === 'with-text' ? 'Community ' : ''}Clinic
        </span>
      )}
    </div>
  );
};

export default Logo;
