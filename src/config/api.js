// src/config/api.js
// Configuration for API endpoints based on environment
import config from './environment';

const getApiBaseUrl = () => {
  // Use the environment configuration
  return config.API_BASE_URL;
};

export const API_BASE_URL = getApiBaseUrl();

// Log the API URL being used for debugging
console.log('API Base URL:', API_BASE_URL);
