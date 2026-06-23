import { Router } from 'express';
import { libraryController } from '../controllers/library.controller';
import { validate } from '../middlewares/validate';
import {
  addLibraryBookSchema,
  listLibraryQuerySchema,
  updateLibraryBookSchema,
  libraryIdParamsSchema,
} from '../schemas/library.schema';

export const libraryRouter = Router();

// Kimlik doğrulaması kaldırıldı: kütüphane herkese açık ve paylaşımlıdır
// (kayıtlar user_id IS NULL olarak tutulur).

// POST /api/library
libraryRouter.post(
  '/',
  validate({ body: addLibraryBookSchema }),
  libraryController.add,
);

// GET /api/library?status=...
libraryRouter.get(
  '/',
  validate({ query: listLibraryQuerySchema }),
  libraryController.list,
);

// PATCH /api/library/:id
libraryRouter.patch(
  '/:id',
  validate({ params: libraryIdParamsSchema, body: updateLibraryBookSchema }),
  libraryController.updateStatus,
);

// DELETE /api/library/:id
libraryRouter.delete(
  '/:id',
  validate({ params: libraryIdParamsSchema }),
  libraryController.remove,
);
