import { Router } from 'express';
import { authRouter } from './auth.routes';
import { booksRouter } from './books.routes';
import { libraryRouter } from './library.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/books', booksRouter);
apiRouter.use('/library', libraryRouter);
