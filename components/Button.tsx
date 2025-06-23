import React, { ButtonHTMLAttributes } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'link' | 'outline-primary' | 'outline-secondary';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconDefinition;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  // Legacy support for existing code
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className = '',
  disabled = false,
  // Legacy support
  isLoading = false,
  leftIcon,
  rightIcon,
  ...rest
}) => {
  // Support legacy props
  const actualLoading = loading || isLoading;
  
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500 shadow-sm',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400 shadow-sm',
    info: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-400 shadow-sm',
    light: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400 shadow-sm',
    dark: 'bg-gray-800 text-white hover:bg-gray-900 focus:ring-gray-600 shadow-sm',
    link: 'bg-transparent text-indigo-600 hover:text-indigo-700 hover:underline focus:ring-indigo-500',
    'outline-primary': 'border-2 border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-600 hover:text-white focus:ring-indigo-500',
    'outline-secondary': 'border-2 border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50 focus:ring-gray-400'
  };
  
  const sizeClasses = {
    xs: 'text-xs px-2 py-1',
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
    xl: 'text-lg px-8 py-4'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  const renderIcon = (position: 'left' | 'right') => {
    if (icon && iconPosition === position) {
      const iconSize = {
        xs: 'text-xs',
        sm: 'text-sm',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg'
      }[size];
      
      return (
        <FontAwesomeIcon 
          icon={icon} 
          className={`${position === 'left' ? 'mr-2' : 'ml-2'} ${iconSize}`}
        />
      );
    }
    
    // Legacy icon support
    if (position === 'left' && leftIcon) {
      return <span className="mr-2">{leftIcon}</span>;
    }
    if (position === 'right' && rightIcon) {
      return <span className="ml-2">{rightIcon}</span>;
    }
    
    return null;
  };

  const renderLoadingSpinner = () => {
    const spinnerSize = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
      xl: 'h-6 w-6'
    }[size];
    
    return (
      <svg className={`animate-spin -ml-1 mr-2 ${spinnerSize} text-current`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 818-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );
  };
  
  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    widthClass,
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button
      className={combinedClasses}
      disabled={disabled || actualLoading}
      {...rest}
    >
      {actualLoading && renderLoadingSpinner()}
      {!actualLoading && renderIcon('left')}
      {children}
      {!actualLoading && renderIcon('right')}
    </button>
  );
};

export default Button; 