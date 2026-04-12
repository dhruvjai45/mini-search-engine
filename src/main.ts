import { testDatabaseConnection } from './config/postgres';
import { logger } from './config/logger';
import { startServer } from './server';
import { autocompleteService } from './modules/autocomplete/autocomplete.service';
import { spellcheckService } from './modules/spellcheck/spellcheck.service';

async function bootstrap() {
  try {
    logger.info('Starting application...');
    await testDatabaseConnection();
    await spellcheckService.initialize();
    await autocompleteService.initialize();
    startServer();
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

void bootstrap();