/**
 * Extract user-friendly error message from API error response
 * @param {Error} error - Axios error object
 * @param {string} fallback - Fallback message if no specific error found
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error, fallback = 'An error occurred') {
  // Check for rate limit error with custom message
  if (error.userMessage) {
    return error.userMessage;
  }

  // Check for API response error message
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Check for validation errors array
  if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.join(', ');
  }

  // Network errors
  if (error.message === 'Network Error') {
    return 'Network error. Please check your connection.';
  }

  // Timeout errors
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout. Please try again.';
  }

  // Default fallback
  return fallback;
}

/**
 * Handle common HTTP status codes
 * @param {number} status - HTTP status code
 * @returns {string|null} User-friendly message or null
 */
export function getStatusMessage(status) {
  const messages = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication required. Please log in.',
    403: 'Access denied. You don\'t have permission.',
    404: 'Resource not found.',
    409: 'Conflict. This resource already exists.',
    413: 'File too large. Please upload a smaller file.',
    415: 'Unsupported file type.',
    422: 'Validation failed. Please check your input.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Please try again later.',
    502: 'Bad gateway. Server is temporarily unavailable.',
    503: 'Service unavailable. Please try again later.',
  };

  return messages[status] || null;
}

/**
 * Check if error is a rate limit error
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export function isRateLimitError(error) {
  return error.response?.status === 429;
}

/**
 * Check if error is an authentication error
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export function isAuthError(error) {
  return error.response?.status === 401;
}

/**
 * Check if error is a validation error
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export function isValidationError(error) {
  return error.response?.status === 400 || error.response?.status === 422;
}
