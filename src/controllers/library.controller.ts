import { Request, Response, NextFunction } from 'express';
import { libraryService } from '../services/library.service';
import {
  AddLibraryBookInput,
  ListLibraryQuery,
  UpdateLibraryBookInput,
  LibraryIdParams,
} from '../schemas/library.schema';

/**
 * Kimlik doğrulaması kaldırıldığından kütüphane herkese açık ve paylaşımlıdır.
 * Tüm kayıtlar sahipsiz (user_id IS NULL) olarak tutulur.
 */
const SHARED_USER_ID = null;

export const libraryController = {
  /** POST /api/library */
  async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as AddLibraryBookInput;
      const book = await libraryService.add(input, SHARED_USER_ID);
      res.status(201).json(book);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/library?status=... */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = req.query as unknown as ListLibraryQuery;
      const books = await libraryService.list(filter, SHARED_USER_ID);
      res.json({ count: books.length, books });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/library/:id */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as LibraryIdParams;
      const { status } = req.body as UpdateLibraryBookInput;
      const book = await libraryService.updateStatus(id, status, SHARED_USER_ID);
      res.json(book);
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/library/:id */
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as LibraryIdParams;
      await libraryService.remove(id, SHARED_USER_ID);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
