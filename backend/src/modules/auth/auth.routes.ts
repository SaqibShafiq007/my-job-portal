// src/modules/auth/auth.routes.ts
import { Router } from 'express';
import { validateBody } from '../../shared/validate';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from './auth.schema';
import { register, login, refresh, logout } from './auth.service';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const body = validateBody(registerSchema, req.body);
    const result = await register(body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const body = validateBody(loginSchema, req.body);
    const result = await login(body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = validateBody(refreshSchema, req.body);
    const tokens = await refresh(refreshToken);
    res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = validateBody(logoutSchema, req.body);
    await logout(refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export { router as authRouter };