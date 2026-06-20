import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post(
  '/register',
  validate({ body: registerSchema }),
  authController.register,
);

// POST /api/auth/login
authRouter.post('/login', validate({ body: loginSchema }), authController.login);
