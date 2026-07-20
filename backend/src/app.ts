import 'reflect-metadata';
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, logger } from './config';
import vehicleRoutes from './routes/vehicle.routes';

const app: Application = express();

// Sécurité de base
app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Parsing du corps des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log des requêtes
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'benitrackpro-backend',
    timestamp: new Date().toISOString(),
  });
});

// Routes API (à brancher au fur et à mesure)
// app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
// app.use('/api/geofences', geofenceRoutes);
// app.use('/api/fleet', fleetRoutes);
// app.use('/api/alerts', alertRoutes);

// 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: `Route ${req.originalUrl} introuvable` });
});

// Gestion centralisée des erreurs
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ message: 'Erreur interne du serveur' });
});

export default app;
