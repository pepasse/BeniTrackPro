// Documentation OpenAPI de BeniTrackPro.
// Toutes les routes sont décrites ici (pas besoin d'annotations dans les fichiers de routes).

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ 'application/json': { schema } });
const body = (schema: object) => ({ required: true, content: json(schema) });
const ok = (description: string, schema?: object) => ({
  description,
  ...(schema ? { content: json(schema) } : {}),
});
const idParam = (name = 'id') => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
});
const jwt = [{ bearerAuth: [] }];
const err = (description: string) => ({ description, content: json(ref('Error')) });

const num = { type: 'number' };
const str = { type: 'string' };

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'BeniTrackPro API',
    version: '1.0.0',
    description:
      "API de suivi de flotte en temps réel. Connecte-toi avec POST /api/auth/login, copie l'accessToken, puis clique sur Authorize.",
  },
  servers: [{ url: 'http://localhost:5000' }],
  tags: [
    { name: 'Auth' },
    { name: 'Véhicules' },
    { name: 'Abonnement' },
    { name: 'Géofences' },
    { name: 'Flotte' },
    { name: 'Appareils' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      apiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-API-Key' },
    },
    schemas: {
      Error: { type: 'object', properties: { message: str } },
      RegisterRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: { type: 'string', example: 'Hermes' },
          email: { type: 'string', example: 'hermes@test.com' },
          password: { type: 'string', example: 'motdepasse123' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', example: 'hermes@test.com' },
          password: { type: 'string', example: 'motdepasse123' },
        },
      },
      User: {
        type: 'object',
        properties: { id: str, fullName: str, email: str, role: str },
      },
      AuthTokens: {
        type: 'object',
        properties: { accessToken: str, refreshToken: str },
      },
      VehicleInput: {
        type: 'object',
        required: ['plateNumber', 'brand', 'model'],
        properties: {
          plateNumber: { type: 'string', example: 'CE-1234-AB' },
          brand: { type: 'string', example: 'Toyota' },
          model: { type: 'string', example: 'Hilux' },
          year: { type: 'integer', example: 2022 },
          type: { type: 'string', enum: ['car', 'truck', 'motorcycle', 'van', 'other'] },
          status: { type: 'string', enum: ['active', 'inactive', 'maintenance'] },
          rfidTag: str,
          fuelConsumptionL100km: { type: 'number', example: 10 },
        },
      },
      Vehicle: {
        allOf: [
          ref('VehicleInput'),
          {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              lastLatitude: num,
              lastLongitude: num,
              lastSpeedKmh: num,
              lastLocationAt: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
      PositionInput: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
          latitude: { type: 'number', example: 4.0511 },
          longitude: { type: 'number', example: 9.7679 },
          speedKmh: { type: 'number', example: 42 },
          heading: { type: 'number', example: 90 },
          recordedAt: { type: 'string', format: 'date-time' },
        },
      },
      VehiclePosition: {
        type: 'object',
        properties: {
          id: str,
          vehicleId: str,
          latitude: num,
          longitude: num,
          speedKmh: num,
          heading: num,
          recordedAt: { type: 'string', format: 'date-time' },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: str,
          vehicleId: str,
          startsAt: { type: 'string', format: 'date-time' },
          expiresAt: { type: 'string', format: 'date-time' },
          status: str,
          daysRemaining: { type: 'integer' },
        },
      },
      RenewSubscriptionInput: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', example: 50000 },
          currency: { type: 'string', example: 'XAF' },
          method: { type: 'string', example: 'mobile_money' },
          reference: str,
        },
      },
      GeofenceInput: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string', example: 'Dépôt' },
          type: { type: 'string', enum: ['circle', 'polygon'] },
          centerLatitude: num,
          centerLongitude: num,
          radiusMeters: { type: 'number', example: 300 },
          polygon: {
            type: 'array',
            items: { type: 'object', properties: { latitude: num, longitude: num } },
          },
          vehicleId: { type: 'string', format: 'uuid' },
          isActive: { type: 'boolean' },
        },
      },
      Geofence: {
        allOf: [ref('GeofenceInput'), { type: 'object', properties: { id: str } }],
      },
      DeviceKeyInput: {
        type: 'object',
        required: ['label'],
        properties: { label: { type: 'string', example: 'Balise camion 1' } },
      },
      DeviceKeyCreated: {
        type: 'object',
        description: 'La clé en clair (apiKey) est affichée une seule fois.',
        properties: { id: str, label: str, apiKey: str, keyPrefix: str },
      },
    },
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Créer un compte',
        requestBody: body(ref('RegisterRequest')),
        responses: { 201: ok('Compte créé'), 400: err('Données invalides'), 409: err('Email déjà utilisé') },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Se connecter',
        requestBody: body(ref('LoginRequest')),
        responses: { 200: ok('Tokens', ref('AuthTokens')), 401: err('Identifiants incorrects') },
      },
    },
    '/api/auth/refresh-token': {
      post: {
        tags: ['Auth'],
        summary: 'Renouveler le token',
        requestBody: body({
          type: 'object',
          required: ['refreshToken'],
          properties: { refreshToken: str },
        }),
        responses: { 200: ok('Nouveaux tokens', ref('AuthTokens')), 401: err('Refresh token invalide') },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Profil connecté',
        security: jwt,
        responses: { 200: ok('Profil', ref('User')), 401: err('Non authentifié') },
      },
    },

    '/api/vehicles': {
      get: {
        tags: ['Véhicules'],
        summary: 'Lister les véhicules',
        security: jwt,
        responses: { 200: ok('Liste', { type: 'array', items: ref('Vehicle') }) },
      },
      post: {
        tags: ['Véhicules'],
        summary: 'Créer un véhicule (abonnement 1 an créé automatiquement)',
        security: jwt,
        requestBody: body(ref('VehicleInput')),
        responses: { 201: ok('Créé', ref('Vehicle')), 400: err('Données invalides') },
      },
    },
    '/api/vehicles/{id}': {
      get: {
        tags: ['Véhicules'],
        summary: 'Détail d’un véhicule',
        security: jwt,
        parameters: [idParam()],
        responses: { 200: ok('Véhicule', ref('Vehicle')), 404: err('Introuvable') },
      },
      put: {
        tags: ['Véhicules'],
        summary: 'Modifier un véhicule',
        security: jwt,
        parameters: [idParam()],
        requestBody: body(ref('VehicleInput')),
        responses: { 200: ok('Modifié', ref('Vehicle')), 404: err('Introuvable') },
      },
      delete: {
        tags: ['Véhicules'],
        summary: 'Supprimer un véhicule',
        security: jwt,
        parameters: [idParam()],
        responses: { 204: ok('Supprimé'), 404: err('Introuvable') },
      },
    },
    '/api/vehicles/{id}/location': {
      get: {
        tags: ['Véhicules'],
        summary: 'Dernière position connue (lisible même si abonnement expiré)',
        security: jwt,
        parameters: [idParam()],
        responses: { 200: ok('Position'), 404: err('Introuvable') },
      },
      post: {
        tags: ['Véhicules'],
        summary: 'Envoyer une position (JWT)',
        security: jwt,
        parameters: [idParam()],
        requestBody: body(ref('PositionInput')),
        responses: {
          201: ok('Position enregistrée', ref('VehiclePosition')),
          400: err('Position invalide'),
          402: err('Abonnement expiré'),
        },
      },
    },
    '/api/vehicles/{id}/history': {
      get: {
        tags: ['Véhicules'],
        summary: 'Historique des positions',
        security: jwt,
        parameters: [
          idParam(),
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { 200: ok('Positions', { type: 'array', items: ref('VehiclePosition') }), 402: err('Abonnement expiré') },
      },
    },
    '/api/vehicles/{id}/stats': {
      get: {
        tags: ['Véhicules'],
        summary: 'Distance parcourue et carburant estimé',
        security: jwt,
        parameters: [
          idParam(),
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { 200: ok('Statistiques'), 404: err('Introuvable') },
      },
    },
    '/api/vehicles/{id}/devices': {
      get: {
        tags: ['Appareils'],
        summary: 'Lister les clés API d’un véhicule',
        security: jwt,
        parameters: [idParam()],
        responses: { 200: ok('Clés', { type: 'array', items: { type: 'object' } }) },
      },
      post: {
        tags: ['Appareils'],
        summary: 'Créer une clé API pour une balise (affichée une seule fois)',
        security: jwt,
        parameters: [idParam()],
        requestBody: body(ref('DeviceKeyInput')),
        responses: { 201: ok('Clé créée', ref('DeviceKeyCreated')), 404: err('Véhicule introuvable') },
      },
    },

    '/api/vehicles/{id}/subscription': {
      get: {
        tags: ['Abonnement'],
        summary: 'Abonnement du véhicule',
        security: jwt,
        parameters: [idParam()],
        responses: { 200: ok('Abonnement', ref('Subscription')), 404: err('Introuvable') },
      },
    },
    '/api/vehicles/{id}/subscription/renew': {
      post: {
        tags: ['Abonnement'],
        summary: 'Renouveler pour 1 an après paiement',
        security: jwt,
        parameters: [idParam()],
        requestBody: body(ref('RenewSubscriptionInput')),
        responses: { 200: ok('Renouvelé'), 400: err('Montant invalide') },
      },
    },
    '/api/vehicles/{id}/subscription/payments': {
      get: {
        tags: ['Abonnement'],
        summary: 'Historique des paiements',
        security: jwt,
        parameters: [idParam()],
        responses: { 200: ok('Paiements', { type: 'array', items: { type: 'object' } }) },
      },
    },

    '/api/geofences': {
      get: {
        tags: ['Géofences'],
        summary: 'Lister les géofences',
        security: jwt,
        responses: { 200: ok('Liste', { type: 'array', items: ref('Geofence') }) },
      },
      post: {
        tags: ['Géofences'],
        summary: 'Créer une géofence (cercle ou polygone)',
        security: jwt,
        requestBody: body(ref('GeofenceInput')),
        responses: { 201: ok('Créée', ref('Geofence')), 400: err('Données invalides') },
      },
    },
    '/api/geofences/{id}': {
      get: {
        tags: ['Géofences'],
        summary: 'Détail d’une géofence',
        security: jwt,
        parameters: [idParam()],
        responses: { 200: ok('Géofence', ref('Geofence')), 404: err('Introuvable') },
      },
      put: {
        tags: ['Géofences'],
        summary: 'Modifier une géofence',
        security: jwt,
        parameters: [idParam()],
        requestBody: body(ref('GeofenceInput')),
        responses: { 200: ok('Modifiée', ref('Geofence')), 404: err('Introuvable') },
      },
      delete: {
        tags: ['Géofences'],
        summary: 'Supprimer une géofence',
        security: jwt,
        parameters: [idParam()],
        responses: { 204: ok('Supprimée'), 404: err('Introuvable') },
      },
    },

    '/api/fleet/stats': {
      get: {
        tags: ['Flotte'],
        summary: 'Statistiques de toute la flotte',
        security: jwt,
        parameters: [
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { 200: ok('Statistiques') },
      },
    },
    '/api/fleet/consumption': {
      get: {
        tags: ['Flotte'],
        summary: 'Consommation de carburant estimée de la flotte',
        security: jwt,
        responses: { 200: ok('Consommation') },
      },
    },

    '/api/devices/location': {
      post: {
        tags: ['Appareils'],
        summary: 'Position envoyée par une balise (clé API, sans JWT)',
        security: [{ apiKeyAuth: [] }],
        requestBody: body(ref('PositionInput')),
        responses: {
          201: ok('Position enregistrée', ref('VehiclePosition')),
          401: err('Clé API invalide'),
          402: err('Abonnement expiré'),
        },
      },
    },
    '/api/devices/{deviceId}': {
      delete: {
        tags: ['Appareils'],
        summary: 'Révoquer une clé API',
        security: jwt,
        parameters: [idParam('deviceId')],
        responses: { 204: ok('Révoquée'), 404: err('Introuvable') },
      },
    },
  },
};
