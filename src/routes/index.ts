import { Router } from 'express';
import { booksRouter } from './books.routes';
import { libraryRouter } from './library.routes';

export const apiRouter = Router();

apiRouter.use('/books', booksRouter);
apiRouter.use('/library', libraryRouter);
