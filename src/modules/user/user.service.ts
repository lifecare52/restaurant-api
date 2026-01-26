import { Types } from 'mongoose';

import { createBrand } from '@modules/brand/brand.service';
// removed default outlet creation on owner creation

import { ROLES, PERMISSIONS } from '@shared/constants';
import { signToken } from '@shared/utils/jwt';

import UserEntity from './user.model';

import type { CreateAdminDTO, CreateOwnerDTO, CreateUserDTO } from './user.types';

export const createOwner = async (adminId: string, dto: CreateOwnerDTO) => {
  const owner = await UserEntity.create({
    name: dto.name,
    email: dto.email,
    password: dto.password,
    role: ROLES.OWNER,
    permissions: Object.values(PERMISSIONS),
    outlets: [],
  });
  const brand = await createBrand(owner._id.toString(), { name: dto.brandName, plan: dto.plan });
  owner.brandId = new Types.ObjectId(brand._id);
  await owner.save();
  return { owner, brand };
};

export const createUser = async (
  creator: { id: string; permissions?: string[] },
  dto: CreateUserDTO,
) => {
  const can = creator.permissions?.includes(PERMISSIONS.USER_MANAGEMENT);
  if (!can) return null;
  if (dto.role === ROLES.PARTNER) {
    const user = await UserEntity.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: ROLES.PARTNER,
      brandId: new Types.ObjectId(dto.brandId),
      permissions: dto.permissions || [],
      outlets: dto.outlets || [],
    });
    return user;
  }
  if (dto.role === ROLES.STAFF) {
    const outlets = dto.outlets || [];
    if (outlets.length === 0) return null;
    const user = await UserEntity.create({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      role: ROLES.STAFF,
      brandId: new Types.ObjectId(dto.brandId),
      permissions: [],
      outlets,
    });
    return user;
  }
  return null;
};

export const login = async (email: string, password: string) => {
  const user = await UserEntity.findOne({ email });
  if (!user) return null;
  const ok = await user.comparePassword(password);
  if (!ok) return null;
  const token = signToken({
    id: user._id.toString(),
    role: user.role,
    brandId: user.brandId?.toString(),
    outlets: (user.outlets || []).map(o => o.toString()),
    permissions: user.permissions || [],
  });
  return { token };
};

export const createAdminBootstrap = async (dto: CreateAdminDTO) => {
  const hasAdmin = await UserEntity.exists({ role: ROLES.ADMIN });
  if (hasAdmin) return null;
  const admin = await UserEntity.create({
    name: dto.name,
    email: dto.email,
    password: dto.password,
    role: ROLES.ADMIN,
    permissions: Object.values(PERMISSIONS),
    outlets: [],
  });
  return admin;
};

export const createAdmin = async (creatorRole: string, dto: CreateAdminDTO) => {
  if (creatorRole !== ROLES.ADMIN) return null;
  const admin = await UserEntity.create({
    name: dto.name,
    email: dto.email,
    password: dto.password,
    role: ROLES.ADMIN,
    permissions: Object.values(PERMISSIONS),
    outlets: [],
  });
  return admin;
};

export default {
  createOwner,
  createUser,
  createAdminBootstrap,
  createAdmin,
};
