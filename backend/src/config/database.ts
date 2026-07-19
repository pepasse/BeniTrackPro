import { createConnection, Connection } from 'typeorm';
import config from './config';
import logger from './logger';

let connection: Connection | null = null;

export const initializeDatabase = async (): Promise<Connection> => {
  try {
    connection = await createConnection({
      type: 'postgres',
      url: config.database.url,
      synchronize: config.env === 'development',
      logging: config.env === 'development',
      entities: ['src/entities/**/*.ts'],
      migrations: ['src/migrations/**/*.ts'],
      subscribers: ['src/subscribers/**/*.ts'],
    });

    logger.info('Database connection established successfully');
    return connection;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

export const getConnection = (): Connection => {
  if (!connection) {
    throw new Error('Database connection not initialized');
  }
  return connection;
};

export const closeDatabase = async (): Promise<void> => {
  if (connection) {
    await connection.close();
    connection = null;
    logger.info('Database connection closed');
  }
};
