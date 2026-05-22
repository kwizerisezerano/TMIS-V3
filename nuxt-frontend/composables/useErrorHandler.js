export const useErrorHandler = () => {
  const toast = useToast()

  const getErrorMessage = (error) => {
    // Network errors
    if (!navigator.onLine) {
      return 'No internet connection. Please check your network and try again.'
    }

    // Server errors
    if (error.response?.status >= 500) {
      return 'Server is temporarily unavailable. Please try again in a few minutes.'
    }

    // Authentication errors
    if (error.response?.status === 401) {
      return 'Your session has expired. Please log in again.'
    }

    // Permission errors
    if (error.response?.status === 403) {
      return 'You don\'t have permission to perform this action.'
    }

    // Not found errors
    if (error.response?.status === 404) {
      return 'The requested information could not be found.'
    }

    // Validation errors - check for specific login errors
    if (error.response?.status === 400) {
      const message = error.response?.data?.message;
      
      // Specific login error messages
      if (message === 'Invalid credentials') {
        return 'Incorrect email or password. Please check your credentials and try again.';
      }
      
      if (message?.includes('verify your account')) {
        return 'Please verify your email address before logging in.';
      }
      
      return message || 'Please check your information and try again.';
    }

    // Database connection errors
    if (error.message?.includes('ECONNREFUSED') || error.message?.includes('connect')) {
      return 'Unable to connect to our servers. Please try again later.'
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Request timed out. Please check your connection and try again.'
    }

    // Payment errors
    if (error.response?.data?.message?.includes('payment')) {
      return 'Payment processing failed. Please try a different payment method.'
    }

    // Email errors
    if (error.response?.data?.message?.includes('email')) {
      return 'Email service is temporarily unavailable. Your account was created successfully.'
    }

    // Default user-friendly message
    return error.response?.data?.message || 'Something went wrong. Please try again.'
  }

  const handleError = (error, customMessage = null) => {
    const message = customMessage || getErrorMessage(error)
    
    toast.add({
      title: 'Error',
      description: message,
      color: 'red',
      timeout: 5000
    })

    console.error('Error details:', error)
  }

  const handleSuccess = (message, title = 'Success') => {
    toast.add({
      title,
      description: message,
      color: 'green',
      timeout: 3000
    })
  }

  return {
    handleError,
    handleSuccess,
    getErrorMessage
  }
}