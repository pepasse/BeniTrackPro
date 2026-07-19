// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Mapbox Configuration
export const MAPBOX_CONFIG = {
  TOKEN: process.env.REACT_APP_MAPBOX_TOKEN,
  STYLE: 'mapbox://styles/mapbox/streets-v12',
  ZOOM: 12,
};

// Environment
export const ENV = {
  isDevelopment: process.env.REACT_APP_ENVIRONMENT === 'development',
  isProduction: process.env.REACT_APP_ENVIRONMENT === 'production',
  isStaging: process.env.REACT_APP_ENVIRONMENT === 'staging',
};

// App Configuration
export const APP_CONFIG = {
  APP_NAME: 'BeniTrackPro',
  VERSION: '1.0.0',
  DESCRIPTION: 'Gestion et suivi des bénéficiaires sociaux',
};

// Authentication Configuration
export const AUTH_CONFIG = {
  TOKEN_KEY: 'authToken',
  REFRESH_TOKEN_KEY: 'refreshToken',
  USER_KEY: 'user',
  TOKEN_EXPIRY_KEY: 'tokenExpiry',
};

// UI Configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: 10,
  MAX_FILE_SIZE: 5242880, // 5MB
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: !ENV.isDevelopment,
  ENABLE_ERROR_TRACKING: !ENV.isDevelopment,
  ENABLE_PERFORMANCE_MONITORING: !ENV.isDevelopment,
};
