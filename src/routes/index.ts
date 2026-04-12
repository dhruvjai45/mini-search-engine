import { Router } from 'express';
import { healthRouter } from './health.routes';
import { documentRouter } from '../modules/documents/document.routes';
import { indexRouter } from '../modules/indexing/index.routes';
import { searchRouter } from '../modules/search/search.routes';
import { autocompleteRouter } from '../modules/autocomplete/autocomplete.routes';
import { spellcheckRouter } from '../modules/spellcheck/spellcheck.routes';

export const apiRouter = Router();

apiRouter.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Mini Search Engine API is running'
  });
});

apiRouter.use('/health', healthRouter);
apiRouter.use('/documents', documentRouter);
apiRouter.use('/index', indexRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/', autocompleteRouter);
apiRouter.use('/spell', spellcheckRouter);