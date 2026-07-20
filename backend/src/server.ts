import 'reflect-metadata';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { config, logger, initializeDatabase, initializeRedis, closeDatabase, closeRedis } from './config';

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  },
});

io.on('connection', (socket) => {
  logger.info(`Client connecté via Socket.io: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client déconnecté: ${socket.id}`);
  });
});

const start = async (): Promise<void> => {
  try {
    await initializeDatabase();
    initializeRedis();

    httpServer.listen(config.port, () => {
      logger.info(`Serveur BeniTrackPro démarré sur le port ${config.port} (${config.env})`);
    });
  } catch (error) {
    logger.error('Échec du démarrage du serveur:', error);
    process.exit(1);
  }
};

const shutdown = async (signal: string): Promise<void> => {
  logger.info(`Signal ${signal} reçu, arrêt en cours...`);
  httpServer.close();
  await closeDatabase();
  await closeRedis();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();

export { io };
