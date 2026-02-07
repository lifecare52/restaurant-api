import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import { getOutletById } from '@modules/outlet/outlet.service';

import type { PaginationQuery } from '@shared/interfaces/pagination';

import MenuItemEntity from './menu-item.model';

import type { MenuItemCreateDTO, MenuItemUpdateDTO } from './menu-item.types';

export const createMenuItem = async (brandId: string, outletId: string, dto: MenuItemCreateDTO) => {
  const brand = await getBrandById(brandId);
  if (!brand) return null;

  const outlet = await getOutletById(brandId, outletId);
  if (!outlet) return null;

  if (dto.hasVariation && dto.basePrice) {
    throw new Error('Base price is not allowed when variations exist');
  }

  try {
    return await MenuItemEntity.create({
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),

      name: dto.name,
      shortCodes: (dto.shortCodes || []).map(s => s.trim().toUpperCase()),
      categoryId: new Types.ObjectId(dto.categoryId),

      dietary: dto.dietary,

      basePrice: dto.basePrice ?? null,
      costPrice: dto.costPrice ?? 0,
      profitPercentage: dto.profitPercentage ?? 0,

      hasVariation: dto.hasVariation ?? false,
      variationGroupIds: dto.variationGroupIds?.map(id => new Types.ObjectId(id)),
      addonGroupIds: dto.addonGroupIds?.map(id => new Types.ObjectId(id)),

      isActive: dto.isActive ?? true,
      isDelete: false,
    });
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw {
        status: 409,
        code: 'DUPLICATE_SHORTCODE',
        message: 'Short code already exists for this outlet',
      };
    }
    throw err;
  }
};

export const listMenuItems = async (
  brandId: string,
  outletId: string,
  pagination: PaginationQuery,
) => {
  const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
  const limit = pagination.limit && pagination.limit > 0 ? pagination.limit : 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  };

  if (pagination.searchText) {
    filter.name = { $regex: new RegExp(pagination.searchText, 'i') };
  }

  const sortColumn = pagination.column || 'name';
  const sortOrder = pagination.order === 'DESC' ? -1 : 1;

  const [items, total] = await Promise.all([
    MenuItemEntity.find(filter)
      .sort({ [sortColumn]: sortOrder })
      .skip(skip)
      .limit(limit),
    MenuItemEntity.countDocuments(filter),
  ]);

  return { items, total };
};

export const getMenuItem = async (brandId: string, menuItemId: string) => {
  return MenuItemEntity.findOne({
    _id: new Types.ObjectId(menuItemId),
    brandId: new Types.ObjectId(brandId),
    isDelete: false,
  });
};

export const updateMenuItem = async (
  brandId: string,
  menuItemId: string,
  dto: MenuItemUpdateDTO,
) => {
  try {
    return await MenuItemEntity.findOneAndUpdate(
      { _id: new Types.ObjectId(menuItemId), brandId: new Types.ObjectId(brandId) },
      {
        $set: {
          ...dto,
          shortCodes: dto.shortCodes ? dto.shortCodes.map(s => s.trim().toUpperCase()) : undefined,
        },
      },
      { new: true },
    );
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw {
        status: 409,
        code: 'DUPLICATE_SHORTCODE',
        message: 'Short code already exists for this outlet',
      };
    }
    throw err;
  }
};

export const deleteMenuItem = async (brandId: string, menuItemId: string) => {
  return MenuItemEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(menuItemId), brandId: new Types.ObjectId(brandId) },
    { $set: { isDelete: true } },
    { new: true },
  );
};

export default {
  createMenuItem,
  listMenuItems,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
