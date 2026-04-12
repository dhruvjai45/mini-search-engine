import { testDatabaseConnection } from './config/postgres';
import { logger } from './config/logger';
import { startServer } from './server';

async function bootstrap() {
  try {
    logger.info('Starting application...');

    await testDatabaseConnection();

    startServer();
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

void bootstrap();