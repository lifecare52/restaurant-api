import {
  createAdmin,
  createAdminBootstrap,
  createOwner,
  createUser,
  login,
  loginAdmin,
} from '@modules/user/user.service';

import { ROLES } from '@shared/constants';

import type { Request, Response, NextFunction } from 'express';

export const createOwnerController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role;
    if (role !== ROLES.ADMIN) {
      res.locals.response = { status: false, code: 403, message: 'Forbidden' };
      next();
      return;
    }
    const result = await createOwner(req.user!.id, req.body);
    res.locals.response = { status: true, code: 201, data: result };
    next();
  } catch (err) {
    next(err);
  }
};

export const createUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const creator = req.user!;
    const user = await createUser(creator, req.body);
    if (!user) {
      res.locals.response = {
        status: false,
        code: 403,
        message: 'Forbidden or invalid payload',
      };
      next();
      return;
    }
    res.locals.response = { status: true, code: 201, data: user };
    next();
  } catch (err) {
    next(err);
  }
};

export const createAdminBootstrapController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const admin = await createAdminBootstrap(req.body);
    if (!admin) {
      res.locals.response = { status: false, code: 403, message: 'Admin already exists' };
      next();
      return;
    }
    res.locals.response = { status: true, code: 201, data: admin };
    next();
  } catch (err) {
    next(err);
  }
};

export const createAdminController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = req.user?.role;
    const admin = await createAdmin(role || '', req.body);
    if (!admin) {
      res.locals.response = { status: false, code: 403, message: 'Forbidden' };
      next();
      return;
    }
    res.locals.response = { status: true, code: 201, data: admin };
    next();
  } catch (err) {
    next(err);
  }
};

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    const result = await login(username, password);
    if (!result) {
      res.locals.response = { status: false, code: 401, message: 'Invalid credentials' };
      next();
      return;
    }
    res.locals.response = { status: true, code: 200, data: result };
    next();
  } catch (err) {
    next(err);
  }
};

export const adminLoginController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body as { username: string; password: string };
    const result = await loginAdmin(username, password);
    if (!result) {
      res.locals.response = { status: false, code: 401, message: 'Invalid credentials' };
      next();
      return;
    }
    res.locals.response = { status: true, code: 200, data: result };
    next();
  } catch (err) {
    next(err);
  }
};
