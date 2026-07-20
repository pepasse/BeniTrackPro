import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from './config';
import logger from './logger';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.database.url,
  synchronize: config.env === 'development',
  logging: config.env === 'development',
  entities: [__dirname + '/../entities/**/*.{ts,js}'],
  migrations: [__dirname + '/../migrations/**/*.{ts,js}'],
  subscribers: [__dirname + '/../subscribers/**/*.{ts,js}'],
});

export const initializeDatabase = async (): Promise<DataSource> => {
  try {
    await AppDataSource.initialize();
    logger.info('Database connection established successfully');
    return AppDataSource;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

export const getConnection = (): DataSource => {
  if (!AppDataSource.isInitialized) {
    throw new Error('Database connection not initialized');
  }
  return AppDataSource;
};

export const closeDatabase = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Database connection closed');
  }
};
