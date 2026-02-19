import {
  createAdmin,
  createAdminBootstrap,
  createOwner,
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  login,
  loginAdmin,
  updateUser,
} from '@modules/user/user.service';
import type { UpdateUserDTO, UserListQueryDTO } from '@modules/user/user.types';

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

export const createOutletUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const creator = req.user!;
    const brandId = req.headers['brand-id'] as string;
    const outletId = req.headers['outlet-id'] as string;

    const outlets = outletId ? [outletId] : [];

    const user = await createUser(creator, { ...req.body, brandId, outlets });
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

export const listOutletUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const brandId = req.headers['brand-id'] as string;
    const query = req.query as unknown as UserListQueryDTO;
    const result = await getUsers(brandId, query);
    res.locals.response = { status: true, code: 200, data: result.data, total: result.total };
    next();
  } catch (err) {
    next(err);
  }
};

export const getOutletUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const brandId = req.headers['brand-id'] as string;
    const userId = req.query.userId as string;
    const user = await getUserById(brandId, userId);
    if (!user) {
      res.locals.response = { status: false, code: 404, message: 'User not found' };
    } else {
      res.locals.response = { status: true, code: 200, data: user };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const updateOutletUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const brandId = req.headers['brand-id'] as string;
    const userId = req.query.userId as string;
    const dto = req.body as UpdateUserDTO;
    const user = await updateUser(brandId, userId, dto);
    if (!user) {
      res.locals.response = { status: false, code: 404, message: 'User not found' };
    } else {
      res.locals.response = { status: true, code: 200, data: user };
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const deleteOutletUserController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const brandId = req.headers['brand-id'] as string;
    const userId = req.query.userId as string;
    const success = await deleteUser(brandId, userId);
    if (!success) {
      res.locals.response = { status: false, code: 404, message: 'User not found' };
    } else {
      res.locals.response = { status: true, code: 200, message: 'User deleted successfully' };
    }
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
    res.locals.response = { status: true, code: 200, data: result };
    next();
  } catch (err) {
    if (err instanceof Error) {
      const message = err.message;
      if (
        message === 'Username not found' ||
        message === 'Incorrect password' ||
        message === 'Your account is deactivated. Please contact your manager.'
      ) {
        res.locals.response = { status: false, code: 401, message };
        next();
        return;
      }
    }
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
