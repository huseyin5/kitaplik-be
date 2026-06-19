import { Router } from 'express';
import { booksController } from '../controllers/books.controller';
import { validate } from '../middlewares/validate';
import {
  searchBooksQuerySchema,
  bookDetailParamsSchema,
} from '../schemas/books.schema';

export const booksRouter = Router();

// GET /api/books/search?q=...&by=title|author&limit=...
booksRouter.get(
  '/search',
  validate({ query: searchBooksQuerySchema }),
  booksController.search,
);

// GET /api/books/:source/:id
booksRouter.get(
  '/:source/:id',
  validate({ params: bookDetailParamsSchema }),
  booksController.detail,
);
