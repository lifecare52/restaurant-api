import { Types, type FilterQuery, type SortOrder } from 'mongoose';

import { ROLES, PERMISSIONS } from '@shared/constants';
import { signToken } from '@shared/utils/jwt';

import UserEntity from './user.model';

import type {
  CreateAdminDTO,
  CreateOwnerDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UserListQueryDTO
} from './user.types';

export const createOwner = async (adminId: string, dto: CreateOwnerDTO) => {
  const owner = await UserEntity.create({
    name: dto.name,
    username: dto.username,
    email: dto.email,
    password: dto.password,
    role: ROLES.OWNER,
    brandId: new Types.ObjectId(dto.brandId),
    permissions: Object.values(PERMISSIONS),
    outlets: (dto.outlets || []).map(id => new Types.ObjectId(id))
  });
  return owner;
};

export const createUser = async (
  creator: { id: string; permissions?: string[] },
  dto: CreateUserDTO
) => {
  const can = creator.permissions?.includes(PERMISSIONS.USER_MANAGEMENT);
  if (!can) return null;

  const commonFields = {
    name: dto.name,
    username: dto.username,
    email: dto.email,
    password: dto.password,
    brandId: new Types.ObjectId(dto.brandId),
    isActive: dto.isActive !== undefined ? dto.isActive : true,
    salary: dto.salary,
    isDelete: false
  };

  if (dto.role === ROLES.PARTNER) {
    const user = await UserEntity.create({
      ...commonFields,
      role: ROLES.PARTNER,
      permissions: dto.permissions || [],
      outlets: dto.outlets || []
    });
    return user;
  }
  if (dto.role === ROLES.STAFF) {
    const outlets = dto.outlets || [];
    if (outlets.length === 0) return null;
    const user = await UserEntity.create({
      ...commonFields,
      role: ROLES.STAFF,
      permissions: [],
      outlets
    });
    return user;
  }
  return null;
};

export const getUsers = async (brandId: string, query: UserListQueryDTO) => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const filter: FilterQuery<unknown> = {
    brandId: new Types.ObjectId(brandId),
    isDelete: false,
    role: { $in: [ROLES.PARTNER, ROLES.STAFF] }
  };

  if (query.role) {
    filter.role = query.role;
  }

  if (query.searchText) {
    const regex = new RegExp(query.searchText, 'i');
    filter.$or = [{ name: regex }, { username: regex }, { email: regex }];
  }

  const sort: Record<string, SortOrder> = {};
  if (query.column) {
    sort[query.column] = query.order === 'ASC' ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  const [data, total] = await Promise.all([
    UserEntity.find(filter).sort(sort).skip(skip).limit(limit),
    UserEntity.countDocuments(filter)
  ]);

  return { data, total, page, limit };
};

export const getUserById = async (brandId: string, userId: string) => {
  return UserEntity.findOne({
    _id: userId,
    brandId: new Types.ObjectId(brandId),
    isDelete: false
  });
};

export const updateUser = async (brandId: string, userId: string, dto: UpdateUserDTO) => {
  const user = await UserEntity.findOne({
    _id: userId,
    brandId: new Types.ObjectId(brandId),
    isDelete: false
  });
  if (!user) return null;

  if (dto.name) user.name = dto.name;
  if (dto.email !== undefined) user.email = dto.email;
  if (dto.password) user.password = dto.password;
  if (dto.role) user.role = dto.role;
  if (dto.outlets) user.outlets = dto.outlets.map(id => new Types.ObjectId(id));
  if (dto.permissions) user.permissions = dto.permissions;
  if (dto.isActive !== undefined) user.isActive = dto.isActive;
  if (dto.salary !== undefined) user.salary = dto.salary;

  await user.save();
  return user;
};

export const deleteUser = async (brandId: string, userId: string) => {
  const user = await UserEntity.findOne({
    _id: userId,
    brandId: new Types.ObjectId(brandId),
    isDelete: false
  });
  if (!user) return null;

  user.isDelete = true;
  user.username = `${user.username}_deleted_${Date.now()}`; // Avoid unique constraint collision
  await user.save();
  return true;
};

export const login = async (username: string, password: string) => {
  const user = await UserEntity.findOne({
    username: (username || '').trim().toLowerCase(),
    isDelete: false
  });
  if (!user) throw new Error('Username not found');
  if (!user.isActive) {
    throw new Error('Your account is deactivated. Please contact your manager.');
  }

  const ok = await user.comparePassword(password);
  if (!ok) throw new Error('Incorrect password');
  const brandId = user.brandId?.toString();
  const outlets = (user.outlets || []).map(o => o.toString());
  const outletId = outlets.length > 0 ? outlets[0] : undefined;
  const token = signToken({
    id: user._id.toString(),
    role: user.role,
    brandId,
    outlets,
    permissions: user.permissions || []
  });
  const userObj = {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role
  };
  return { token, brandId, outletId, user: userObj };
};

export const loginAdmin = async (username: string, password: string) => {
  const user = await UserEntity.findOne({
    username: (username || '').trim().toLowerCase(),
    isDelete: false
  });
  if (!user || user.role !== ROLES.ADMIN) return null;
  const ok = await user.comparePassword(password);
  if (!ok) return null;
  const token = signToken({
    id: user._id.toString(),
    role: user.role,
    permissions: user.permissions || []
  });
  const userObj = {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
    role: user.role
  };
  return { token, user: userObj };
};

export const createAdminBootstrap = async (dto: CreateAdminDTO) => {
  const hasAdmin = await UserEntity.exists({ role: ROLES.ADMIN, isDelete: false });
  if (hasAdmin) return null;
  const admin = await UserEntity.create({
    name: dto.name,
    username: dto.username,
    email: dto.email,
    password: dto.password,
    role: ROLES.ADMIN,
    permissions: Object.values(PERMISSIONS),
    outlets: []
  });
  return admin;
};

export const createAdmin = async (creatorRole: string, dto: CreateAdminDTO) => {
  if (creatorRole !== ROLES.ADMIN) return null;
  const admin = await UserEntity.create({
    name: dto.name,
    username: dto.username,
    email: dto.email,
    password: dto.password,
    role: ROLES.ADMIN,
    permissions: Object.values(PERMISSIONS),
    outlets: []
  });
  return admin;
};

export default {
  createOwner,
  createUser,
  createAdminBootstrap,
  createAdmin,
  loginAdmin
};
