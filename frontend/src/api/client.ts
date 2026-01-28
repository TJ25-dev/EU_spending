import axios from 'axios';
import type { ApiError } from '../types';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add any auth tokens or request transforms
apiClient.interceptors.request.use(
  (config) => {
    // Could add auth token here if needed in the future
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors consistently
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      statusCode: 500,
    };

    if (error.response) {
      // Server responded with an error status code
      apiError.statusCode = error.response.status;
      apiError.message =
        error.response.data?.message ||
        error.response.data?.error ||
        getDefaultErrorMessage(error.response.status);
      apiError.details = error.response.data?.details;
    } else if (error.request) {
      // Request was made but no response received
      apiError.message = 'Unable to reach the server. Please check your connection.';
      apiError.statusCode = 0;
    } else {
      // Something went wrong setting up the request
      apiError.message = error.message || 'Failed to make request';
    }

    console.error(`API Error [${apiError.statusCode}]: ${apiError.message}`, error);
    return Promise.reject(apiError);
  }
);

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication required.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Server is temporarily unavailable. Please try again later.';
    case 503:
      return 'Service is under maintenance. Please try again later.';
    default:
      return `Request failed with status ${status}.`;
  }
}

export default apiClient;
