import { Router } from 'express';
import { booksRouter } from './books.routes';
import { libraryRouter } from './library.routes';
import { pushRouter } from './push.routes';

export const apiRouter = Router();

apiRouter.use('/books', booksRouter);
apiRouter.use('/library', libraryRouter);
apiRouter.use('/push', pushRouter);
