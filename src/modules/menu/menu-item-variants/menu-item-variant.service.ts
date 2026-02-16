import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import MenuItemVariantEntity from '@modules/menu/menu-item-variants/menu-item-variant.model';
import type {
  MenuItemVariantCreateDTO,
  MenuItemVariantUpdateDTO,
} from '@modules/menu/menu-item-variants/menu-item-variant.types';
import { getMenuItem } from '@modules/menu/menu-items/menu-item.service';
import { getVariation } from '@modules/menu/variations/variation.service';
import { getOutletById } from '@modules/outlet/outlet.service';

import type { PaginationQuery } from '@shared/interfaces/pagination';

export const createMenuItemVariant = async (
  brandId: string,
  outletId: string,
  dto: MenuItemVariantCreateDTO,
) => {
  const brand = await getBrandById(brandId);
  if (!brand) return null;

  const outlet = await getOutletById(brandId, outletId);
  if (!outlet) return null;

  const item = await getMenuItem(brandId, dto.menuItemId);
  if (!item || String(item.outletId) !== String(outletId)) return null;

  const variation = await getVariation(brandId, outletId, dto.variationId);
  if (!variation) return null;

  try {
    if (dto.isDefault) {
      await MenuItemVariantEntity.updateMany(
        {
          brandId: new Types.ObjectId(brandId),
          outletId: new Types.ObjectId(outletId),
          menuItemId: new Types.ObjectId(dto.menuItemId),
          isDelete: false,
        },
        { $set: { isDefault: false } },
      );
    }
    return await MenuItemVariantEntity.create({
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      menuItemId: new Types.ObjectId(dto.menuItemId),
      variationId: new Types.ObjectId(dto.variationId),
      price: dto.price,
      isActive: dto.isActive ?? true,
      isDelete: false,
      isDefault: dto.isDefault ?? false,
    });
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw {
        status: 409,
        code: 'DUPLICATE_MENU_ITEM_VARIANT',
        message: 'Variant already attached to this menu item or default already exists',
      };
    }
    throw err;
  }
};

export const listMenuItemVariants = async (
  brandId: string,
  outletId: string,
  pagination: PaginationQuery & { menuItemId?: string; variationId?: string },
) => {
  const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
  const limit = pagination.limit && pagination.limit > 0 ? pagination.limit : 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  };

  if (pagination.menuItemId) {
    filter.menuItemId = new Types.ObjectId(pagination.menuItemId);
  }
  if (pagination.variationId) {
    filter.variationId = new Types.ObjectId(pagination.variationId);
  }

  const sortColumn = pagination.column || 'createdAt';
  const sortOrder = pagination.order === 'DESC' ? -1 : 1;

  const [items, total] = await Promise.all([
    MenuItemVariantEntity.find(filter)
      .sort({ [sortColumn]: sortOrder })
      .skip(skip)
      .limit(limit),
    MenuItemVariantEntity.countDocuments(filter),
  ]);

  return { items, total };
};

export const getMenuItemVariant = async (
  brandId: string,
  outletId: string,
  menuItemVariantId: string,
) => {
  return MenuItemVariantEntity.findOne({
    _id: new Types.ObjectId(menuItemVariantId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  });
};

export const updateMenuItemVariant = async (
  brandId: string,
  outletId: string,
  menuItemVariantId: string,
  dto: MenuItemVariantUpdateDTO,
) => {
  try {
    if (dto.isDefault) {
      const current = await MenuItemVariantEntity.findOne({
        _id: new Types.ObjectId(menuItemVariantId),
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        isDelete: false,
      });
      if (current) {
        await MenuItemVariantEntity.updateMany(
          {
            brandId: new Types.ObjectId(brandId),
            outletId: new Types.ObjectId(outletId),
            menuItemId: current.menuItemId,
            isDelete: false,
            _id: { $ne: current._id },
          },
          { $set: { isDefault: false } },
        );
      }
    }
    return await MenuItemVariantEntity.findOneAndUpdate(
      {
        _id: new Types.ObjectId(menuItemVariantId),
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
      },
      { $set: dto },
      { new: true },
    );
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw {
        status: 409,
        code: 'DUPLICATE_MENU_ITEM_VARIANT',
        message: 'Variant already attached to this menu item or default already exists',
      };
    }
    throw err;
  }
};

export const deleteMenuItemVariant = async (
  brandId: string,
  outletId: string,
  menuItemVariantId: string,
) => {
  return MenuItemVariantEntity.findOneAndUpdate(
    {
      _id: new Types.ObjectId(menuItemVariantId),
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
    },
    { $set: { isDelete: true } },
    { new: true },
  );
};

export default {
  createMenuItemVariant,
  listMenuItemVariants,
  getMenuItemVariant,
  updateMenuItemVariant,
  deleteMenuItemVariant,
};
