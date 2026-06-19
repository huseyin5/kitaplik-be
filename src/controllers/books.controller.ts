import { Request, Response, NextFunction } from 'express';
import { booksService } from '../services/books.service';
import { SearchBooksQuery, BookDetailParams } from '../schemas/books.schema';

export const booksController = {
  /** GET /api/books/search?q=...&by=title|author&limit=... */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // validate middleware sayesinde query tip güvenli ve dönüştürülmüş durumda.
      const params = req.query as unknown as SearchBooksQuery;
      const results = await booksService.search(params);

      res.json({
        count: results.length,
        results,
      });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/books/:source/:id */
  async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { source, id } = req.params as unknown as BookDetailParams;
      const book = await booksService.getDetail(source, id);
      res.json(book);
    } catch (err) {
      next(err);
    }
  },
};
