import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faInfoCircle, faXmark } from '@fortawesome/free-solid-svg-icons';

export interface AlertProps {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onClose?: () => void;
}

const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-400',
          text: 'text-green-800',
          icon: faCheckCircle,
          iconColor: 'text-green-500'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-400',
          text: 'text-red-800',
          icon: faExclamationTriangle,
          iconColor: 'text-red-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-400',
          text: 'text-yellow-800',
          icon: faExclamationTriangle,
          iconColor: 'text-yellow-500'
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-400',
          text: 'text-blue-800',
          icon: faInfoCircle,
          iconColor: 'text-blue-500'
        };
    }
  };

  const styles = getAlertStyles();

  return (
    <div className={`${styles.bg} ${styles.border} border-l-4 p-4 mb-4 rounded-md flex justify-between items-start`}>
      <div className="flex">
        <div className={`mr-3 ${styles.iconColor}`}>
          <FontAwesomeIcon icon={styles.icon} />
        </div>
        <div className={styles.text}>{message}</div>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className={`${styles.text} hover:opacity-75 focus:outline-none`}
          aria-label="Close"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>
      )}
    </div>
  );
};

export default Alert; 