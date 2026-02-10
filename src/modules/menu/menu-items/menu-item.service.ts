import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import { getOutletById } from '@modules/outlet/outlet.service';
import { listMenuItemVariants } from '@modules/menu/menu-item-variants/menu-item-variant.service';
import { listMenuItemAddons } from '@modules/menu/menu-item-addons/menu-item-addon.service';
import { getVariation } from '@modules/menu/variations/variation.service';
import { getAddon } from '@modules/menu/addons/addon.service';
import type { MenuItem } from './menu-item.model';

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

const buildMenuItemNested = async (
  brandId: string,
  outletId: string,
  item: (MenuItem & { _id: Types.ObjectId; outletId: Types.ObjectId; toObject?: () => any }),
) => {
  const variantsResult = await listMenuItemVariants(brandId, outletId, {
    page: 1,
    limit: 1000,
    menuItemId: String(item?._id),
    column: 'createdAt',
    order: 'ASC',
  } as any);

  const hasVariants = (variantsResult.items || []).length > 0;

  const variations = await Promise.all(
    (variantsResult.items || [])
      .filter(v => v.isActive)
      .map(async v => {
        const variation = await getVariation(brandId, outletId, String(v.variationId));
        const addonsResult = await listMenuItemAddons(
          brandId,
          outletId,
          { page: 1, limit: 1000, column: 'createdAt', order: 'ASC' } as any,
          { menuItemId: String(item?._id), menuItemVariantId: String(v._id) },
        );
        const addons = await Promise.all(
          (addonsResult.items || [])
            .filter(a => a.isActive)
            .map(async a => {
              const addonDoc = await getAddon(brandId, outletId, String(a.addonId));
              return { name: addonDoc?.name ?? '', items: a.allowedItems ?? [] };
            }),
        );
        return { name: variation?.name ?? '', addons };
      }),
  );

  let topLevelAddons: Array<{ name: string; items: unknown[] }> | undefined;
  if (!hasVariants) {
    const itemAddonsResult = await listMenuItemAddons(
      brandId,
      outletId,
      { page: 1, limit: 1000, column: 'createdAt', order: 'ASC' } as any,
      { menuItemId: String(item?._id) },
    );
    const itemLevelActive = (itemAddonsResult.items || [])
      .filter(a => !a.menuItemVariantId)
      .filter(a => a.isActive);
    topLevelAddons = await Promise.all(
      itemLevelActive.map(async a => {
        const addonDoc = await getAddon(brandId, outletId, String(a.addonId));
        return { name: addonDoc?.name ?? '', items: a.allowedItems ?? [] };
      }),
    );
  }

  const base = item?.toObject ? item.toObject() : (item as any);
  if (hasVariants) {
    return { ...base, variations };
  }
  return { ...base, variations: [], addons: topLevelAddons ?? [] };
};

export const listMenuItemsWithNested = async (
  brandId: string,
  outletId: string,
  pagination: PaginationQuery,
) => {
  const result = await listMenuItems(brandId, outletId, pagination);
  const enriched = await Promise.all(
    result.items.map(i => buildMenuItemNested(brandId, outletId, i as unknown as MenuItem & { _id: Types.ObjectId; outletId: Types.ObjectId; toObject?: () => any })),
  );
  return { items: enriched, total: result.total };
};

export const getMenuItemWithNested = async (brandId: string, outletId: string, menuItemId: string) => {
  const item = await getMenuItem(brandId, menuItemId);
  if (!item || String(item.outletId) !== String(outletId)) return null;
  return buildMenuItemNested(
    brandId,
    outletId,
    item as unknown as MenuItem & { _id: Types.ObjectId; outletId: Types.ObjectId; toObject?: () => any },
  );
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
  listMenuItemsWithNested,
  getMenuItem,
  getMenuItemWithNested,
  updateMenuItem,
  deleteMenuItem,
};
