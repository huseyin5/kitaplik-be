import { Request, Response, NextFunction } from 'express';
import { libraryService } from '../services/library.service';
import { AppError } from '../utils/AppError';
import {
  AddLibraryBookInput,
  ListLibraryQuery,
  UpdateLibraryBookInput,
  LibraryIdParams,
} from '../schemas/library.schema';

/**
 * Aktif kullanıcının id'si. `authenticate` middleware'i tüm kütüphane
 * route'larından önce çalıştığı için `req.user` daima dolu olmalı; değilse
 * (beklenmeyen durum) 401 fırlatırız ve asla null user verisine düşmeyiz.
 */
function currentUserId(req: Request): string {
  const id = req.user?.id;
  if (!id) {
    throw new AppError(401, 'Oturum açmanız gerekiyor');
  }
  return id;
}

export const libraryController = {
  /** POST /api/library */
  async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as AddLibraryBookInput;
      const book = await libraryService.add(input, currentUserId(req));
      res.status(201).json(book);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/library?status=... */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = req.query as unknown as ListLibraryQuery;
      const books = await libraryService.list(filter, currentUserId(req));
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
      const book = await libraryService.updateStatus(id, status, currentUserId(req));
      res.json(book);
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/library/:id */
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as LibraryIdParams;
      await libraryService.remove(id, currentUserId(req));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
