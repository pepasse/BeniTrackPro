import { API_CONFIG } from './config';

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// API Endpoints
export const ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Users
  USERS: {
    GET_PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    GET_ALL: '/users',
    GET_BY_ID: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },

  // Beneficiaries
  BENEFICIARIES: {
    GET_ALL: '/beneficiaries',
    GET_BY_ID: (id: string) => `/beneficiaries/${id}`,
    CREATE: '/beneficiaries',
    UPDATE: (id: string) => `/beneficiaries/${id}`,
    DELETE: (id: string) => `/beneficiaries/${id}`,
    SEARCH: '/beneficiaries/search',
    EXPORT: '/beneficiaries/export',
  },

  // Assistance Programs
  PROGRAMS: {
    GET_ALL: '/programs',
    GET_BY_ID: (id: string) => `/programs/${id}`,
    CREATE: '/programs',
    UPDATE: (id: string) => `/programs/${id}`,
    DELETE: (id: string) => `/programs/${id}`,
  },

  // Distributions
  DISTRIBUTIONS: {
    GET_ALL: '/distributions',
    GET_BY_ID: (id: string) => `/distributions/${id}`,
    CREATE: '/distributions',
    UPDATE: (id: string) => `/distributions/${id}`,
    DELETE: (id: string) => `/distributions/${id}`,
  },

  // Reports
  REPORTS: {
    GET_DASHBOARD: '/reports/dashboard',
    GET_BENEFICIARIES: '/reports/beneficiaries',
    GET_DISTRIBUTIONS: '/reports/distributions',
    EXPORT_PDF: '/reports/export/pdf',
    EXPORT_CSV: '/reports/export/csv',
  },

  // Notifications
  NOTIFICATIONS: {
    GET_ALL: '/notifications',
    MARK_AS_READ: (id: string) => `/notifications/${id}/read`,
    DELETE: (id: string) => `/notifications/${id}`,
  },

  // Health Check
  HEALTH: '/health',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion réseau. Veuillez vérifier votre connexion.',
  INVALID_CREDENTIALS: 'Identifiants invalides. Veuillez réessayer.',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à accéder à cette ressource.',
  NOT_FOUND: 'La ressource demandée n\'a pas été trouvée.',
  SERVER_ERROR: 'Une erreur serveur s\'est produite. Veuillez réessayer plus tard.',
  VALIDATION_ERROR: 'Veuillez vérifier les informations saisies.',
  TIMEOUT: 'La requête a expiré. Veuillez réessayer.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Connexion réussie!',
  REGISTER_SUCCESS: 'Inscription réussie! Veuillez vous connecter.',
  PROFILE_UPDATED: 'Profil mis à jour avec succès.',
  BENEFICIARY_CREATED: 'Bénéficiaire créé avec succès.',
  BENEFICIARY_UPDATED: 'Bénéficiaire mis à jour avec succès.',
  BENEFICIARY_DELETED: 'Bénéficiaire supprimé avec succès.',
  PROGRAM_CREATED: 'Programme créé avec succès.',
  DISTRIBUTION_CREATED: 'Distribution créée avec succès.',
  EXPORT_SUCCESS: 'Rapport exporté avec succès.',
};
