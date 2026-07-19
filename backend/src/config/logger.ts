import winston from 'winston';
import config from './config';
import path from 'path';
import fs from 'fs';

// Créer le répertoire des logs s'il n'existe pas
const logsDir = path.dirname(config.logging.file);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'benitrackpro' },
  transports: [
    // Erreurs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
    // Tous les logs
    new winston.transports.File({
      filename: config.logging.file,
    }),
  ],
});

// En développement, ajouter aussi la console
if (config.env !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ level, message, timestamp }) =>
            `${timestamp} [${level}]: ${message}`
        )
      ),
    })
  );
}

export default logger;
