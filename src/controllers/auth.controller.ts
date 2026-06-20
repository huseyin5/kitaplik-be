import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

export const authController = {
  /** POST /api/auth/register */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body as RegisterInput;
      const result = await authService.register(username, password);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/auth/login */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body as LoginInput;
      const result = await authService.login(username, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
