import toast from 'react-hot-toast';

// Custom styled toast notifications
export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#10b981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#10b981',
      },
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#ef4444',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
      },
      iconTheme: {
        primary: '#fff',
        secondary: '#ef4444',
      },
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return toast(message, {
      duration: 4500,
      position: 'top-right',
      icon: '⚠️',
      style: {
        background: '#f59e0b',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
      },
      ...options,
    });
  },

  info: (message, options = {}) => {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#3b82f6',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
      },
      ...options,
    });
  },

  loading: (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#6b7280',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(107, 114, 128, 0.2)',
      },
      ...options,
    });
  },

  promise: (promise, messages, options = {}) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Error occurred',
      },
      {
        position: 'top-right',
        style: {
          padding: '16px',
          borderRadius: '8px',
        },
        success: {
          style: {
            background: '#10b981',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#10b981',
          },
        },
        error: {
          style: {
            background: '#ef4444',
            color: '#fff',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ef4444',
          },
        },
        ...options,
      }
    );
  },

  // Dismiss specific toast
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  // Dismiss all toasts
  dismissAll: () => {
    toast.dismiss();
  },
};

export default showToast;
