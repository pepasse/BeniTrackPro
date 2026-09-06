export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/api/auth/register',
    LOGIN: '/api/auth/login',
    REFRESH: '/api/auth/refresh-token',
    ME: '/api/auth/me',
  },
  VEHICLES: {
    GET_ALL: '/api/vehicles',
    GET_BY_ID: (id: string) => `/api/vehicles/${id}`,
    CREATE: '/api/vehicles',
    UPDATE: (id: string) => `/api/vehicles/${id}`,
    DELETE: (id: string) => `/api/vehicles/${id}`,
    LOCATION: (id: string) => `/api/vehicles/${id}/location`,
    HISTORY: (id: string) => `/api/vehicles/${id}/history`,
    STATS: (id: string) => `/api/vehicles/${id}/stats`,
    SUBSCRIPTION: (id: string) => `/api/vehicles/${id}/subscription`,
    SUBSCRIPTION_RENEW: (id: string) => `/api/vehicles/${id}/subscription/renew`,
  },
  GEOFENCES: {
    GET_ALL: '/api/geofences',
    CREATE: '/api/geofences',
    UPDATE: (id: string) => `/api/geofences/${id}`,
    DELETE: (id: string) => `/api/geofences/${id}`,
  },
  FLEET: {
    STATS: '/api/fleet/stats',
    CONSUMPTION: '/api/fleet/consumption',
  },
};
