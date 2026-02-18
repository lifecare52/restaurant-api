import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import { getAddon } from '@modules/menu/addons/addon.service';
import {
  listMenuItemAddons,
  createMenuItemAddon,
  updateMenuItemAddon,
} from '@modules/menu/menu-item-addons/menu-item-addon.service';
import {
  listMenuItemVariants,
  createMenuItemVariant,
} from '@modules/menu/menu-item-variants/menu-item-variant.service';
import MenuItemEntity from '@modules/menu/menu-items/menu-item.model';
import type { MenuItem } from '@modules/menu/menu-items/menu-item.types';
import { getVariation } from '@modules/menu/variations/variation.service';
import { getOutletById } from '@modules/outlet/outlet.service';

import type { PaginationQuery } from '@shared/interfaces/pagination';

import type { MenuItemCreateDTO, MenuItemUpdateDTO } from './menu-item.types';

export const createMenuItem = async (brandId: string, outletId: string, dto: MenuItemCreateDTO) => {
  const brand = await getBrandById(brandId);
  if (!brand) return null;

  const outlet = await getOutletById(brandId, outletId);
  if (!outlet) return null;

  try {
    const normalizeAddonCreate = (
      arr:
        | Array<{ addonId: string; isSingleSelect?: boolean; min?: number; max?: number }>
        | undefined,
    ) => {
      return (arr || []).map(a => ({
        addonId: a.addonId,
        isSingleSelect: a.isSingleSelect,
        min: a.min,
        max: a.max,
      }));
    };
    const variationsInput = (dto.variations || []).map(v => ({
      variationId: v.variationId,
      basePrice: v.basePrice,
      costPrice: v.costPrice,
      addons: normalizeAddonCreate(v.addons),
    }));
    const topLevelAddons = normalizeAddonCreate(dto.addons);
    if (variationsInput.length > 0) {
      const ids = new Set<string>();
      for (const v of variationsInput) {
        if (ids.has(v.variationId)) {
          throw {
            status: 400,
            code: 'DUPLICATE_VARIATION',
            message: 'Duplicate variationId in input',
          };
        }
        ids.add(v.variationId);
        const exists = await getVariation(brandId, outletId, v.variationId);
        if (!exists) {
          throw { status: 404, code: 'VARIATION_NOT_FOUND', message: 'Variation not found' };
        }
        for (const addon of v.addons || []) {
          const addonDoc = await getAddon(brandId, outletId, addon.addonId);
          if (!addonDoc) {
            throw { status: 404, code: 'ADDON_NOT_FOUND', message: 'Addon not found' };
          }
        }
      }
    }
    if (variationsInput.length === 0 && topLevelAddons.length > 0) {
      const ids = new Set<string>();
      for (const a of topLevelAddons) {
        if (ids.has(a.addonId)) {
          throw { status: 400, code: 'DUPLICATE_ADDON', message: 'Duplicate addonId in input' };
        }
        ids.add(a.addonId);
        const addonDoc = await getAddon(brandId, outletId, a.addonId);
        if (!addonDoc) {
          throw { status: 404, code: 'ADDON_NOT_FOUND', message: 'Addon not found' };
        }
      }
    }
    const created = await MenuItemEntity.create({
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),

      name: dto.name,
      shortCodes: (dto.shortCodes || []).map(s => s.trim().toUpperCase()),
      categoryId: new Types.ObjectId(dto.categoryId),

      dietary: dto.dietary,

      basePrice: dto.basePrice ?? null,
      costPrice: dto.costPrice ?? 0,

      isActive: dto.isActive ?? true,
      isDelete: false,
    });
    if (variationsInput.length > 0) {
      const createdVariants = await Promise.all(
        variationsInput.map(v =>
          createMenuItemVariant(brandId, outletId, {
            menuItemId: String(created._id),
            variationId: v.variationId,
            basePrice: v.basePrice,
            costPrice: v.costPrice,
            isActive: true,
            isDefault: false,
          }),
        ),
      );
      const byVariationId = new Map<string, Types.ObjectId>();
      createdVariants.forEach((doc, idx) => {
        if (doc) {
          byVariationId.set(variationsInput[idx].variationId, doc._id as unknown as Types.ObjectId);
        }
      });
      for (const v of variationsInput) {
        const variantDocId = byVariationId.get(v.variationId);
        if (!variantDocId) continue;
        for (const addon of v.addons || []) {
          await createMenuItemAddon(brandId, outletId, {
            menuItemId: String(created._id),
            addonId: addon.addonId,
            menuItemVariantId: String(variantDocId),
            isSingleSelect: addon.isSingleSelect,
            min: addon.min,
            max: addon.max,
            isActive: true,
          });
        }
      }
    } else if (topLevelAddons.length > 0) {
      await Promise.all(
        topLevelAddons.map(addon =>
          createMenuItemAddon(brandId, outletId, {
            menuItemId: String(created._id),
            addonId: addon.addonId,
            isSingleSelect: addon.isSingleSelect,
            min: addon.min,
            max: addon.max,
            isActive: true,
          }),
        ),
      );
    }
    return created;
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
  item: MenuItem & {
    _id: Types.ObjectId;
    outletId: Types.ObjectId;
    toObject?: () => Record<string, unknown>;
  },
) => {
  const variantsResult = await listMenuItemVariants(brandId, outletId, {
    page: 1,
    limit: 1000,
    menuItemId: String(item?._id),
    column: 'createdAt',
    order: 'ASC',
  });

  const hasVariants = (variantsResult.items || []).length > 0;

  const variations = await Promise.all(
    (variantsResult.items || [])
      .filter(v => v.isActive)
      .map(async v => {
        const variation = await getVariation(brandId, outletId, String(v.variationId));
        const addonsResult = await listMenuItemAddons(
          brandId,
          outletId,
          { page: 1, limit: 1000, column: 'createdAt', order: 'ASC' },
          { menuItemId: String(item?._id), menuItemVariantId: String(v._id) },
        );
        const addons = await Promise.all(
          (addonsResult.items || [])
            .filter(a => a.isActive)
            .map(async a => {
              const addonDoc = await getAddon(brandId, outletId, String(a.addonId));
              return {
                name: addonDoc?.name ?? '',
                items: a.allowedItems ?? [],
                isSingleSelect: a.isSingleSelect ?? false,
                min: a.min ?? undefined,
                max: a.max ?? undefined,
              };
            }),
        );
        return { name: variation?.name ?? '', price: v.basePrice, addons };
      }),
  );

  let topLevelAddons: Array<{ name: string; items: unknown[] }> | undefined;
  if (!hasVariants) {
    const itemAddonsResult = await listMenuItemAddons(
      brandId,
      outletId,
      { page: 1, limit: 1000, column: 'createdAt', order: 'ASC' },
      { menuItemId: String(item?._id) },
    );
    const itemLevelActive = (itemAddonsResult.items || [])
      .filter(a => !a.menuItemVariantId)
      .filter(a => a.isActive);
    topLevelAddons = await Promise.all(
      itemLevelActive.map(async a => {
        const addonDoc = await getAddon(brandId, outletId, String(a.addonId));
        return {
          name: addonDoc?.name ?? '',
          items: a.allowedItems ?? [],
          isSingleSelect: a.isSingleSelect ?? false,
          min: a.min ?? undefined,
          max: a.max ?? undefined,
        };
      }),
    );
  }

  const base = item?.toObject ? item.toObject() : (item as unknown as Record<string, unknown>);
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
    result.items.map(i =>
      buildMenuItemNested(
        brandId,
        outletId,
        i as unknown as MenuItem & {
          _id: Types.ObjectId;
          outletId: Types.ObjectId;
          toObject?: () => Record<string, unknown>;
        },
      ),
    ),
  );
  return { items: enriched, total: result.total };
};

export const getMenuItemWithNested = async (
  brandId: string,
  outletId: string,
  menuItemId: string,
) => {
  const item = await getMenuItem(brandId, menuItemId);
  if (!item || String(item.outletId) !== String(outletId)) return null;
  return buildMenuItemNested(
    brandId,
    outletId,
    item as unknown as MenuItem & {
      _id: Types.ObjectId;
      outletId: Types.ObjectId;
      toObject?: () => Record<string, unknown>;
    },
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
    const updated = await MenuItemEntity.findOneAndUpdate(
      { _id: new Types.ObjectId(menuItemId), brandId: new Types.ObjectId(brandId) },
      {
        $set: {
          ...dto,
          shortCodes: dto.shortCodes ? dto.shortCodes.map(s => s.trim().toUpperCase()) : undefined,
        },
      },
      { new: true },
    );
    if (!updated) return updated;

    // If addons/variations provided, upsert menu_item_addons accordingly
    const outletId = String(updated.outletId);
    const normalizeAddonUpdate = (
      arr:
        | Array<{
            addonId: string;
            allowedItems?: string[];
            isSingleSelect?: boolean;
            min?: number;
            max?: number;
          }>
        | undefined,
    ) => {
      return (arr || []).map(a => ({
        addonId: a.addonId,
        allowedItemIds: (a.allowedItems || []).map(s => s),
        isSingleSelect: a.isSingleSelect,
        min: a.min,
        max: a.max,
      }));
    };

    if (dto.variations && dto.variations.length > 0) {
      const variants = await listMenuItemVariants(brandId, outletId, {
        page: 1,
        limit: 1000,
        menuItemId,
        column: 'createdAt',
        order: 'ASC',
      });
      const byVariationId = new Map<string, string>();
      (variants.items || []).forEach(v => byVariationId.set(String(v.variationId), String(v._id)));

      for (const v of dto.variations) {
        const variantDocId = byVariationId.get(v.variationId);
        if (!variantDocId) continue;
        const addons = normalizeAddonUpdate(v.addons);
        for (const a of addons) {
          // Try find existing attachment
          const existing = await listMenuItemAddons(
            brandId,
            outletId,
            { page: 1, limit: 1, column: 'createdAt', order: 'ASC' },
            { menuItemId, addonId: a.addonId, menuItemVariantId: variantDocId },
          );
          if (existing.items && existing.items.length > 0) {
            await updateMenuItemAddon(brandId, outletId, String(existing.items[0]._id), {
              allowedItemIds: a.allowedItemIds,
              isSingleSelect: a.isSingleSelect,
              min: a.min,
              max: a.max,
            });
          } else {
            const created = await createMenuItemAddon(brandId, outletId, {
              menuItemId,
              addonId: a.addonId,
              menuItemVariantId: variantDocId,
              isSingleSelect: a.isSingleSelect,
              min: a.min,
              max: a.max,
              isActive: true,
            });
            if (created && a.allowedItemIds && a.allowedItemIds.length > 0) {
              await updateMenuItemAddon(brandId, outletId, String(created._id), {
                allowedItemIds: a.allowedItemIds,
              });
            }
          }
        }
      }
    } else if (dto.addons && dto.addons.length > 0) {
      const addons = normalizeAddonUpdate(dto.addons);
      for (const a of addons) {
        const existing = await listMenuItemAddons(
          brandId,
          outletId,
          { page: 1, limit: 1, column: 'createdAt', order: 'ASC' },
          { menuItemId, addonId: a.addonId },
        );
        if (existing.items && existing.items.length > 0) {
          await updateMenuItemAddon(brandId, outletId, String(existing.items[0]._id), {
            allowedItemIds: a.allowedItemIds,
            isSingleSelect: a.isSingleSelect,
            min: a.min,
            max: a.max,
          });
        } else {
          const createdAddon = await createMenuItemAddon(brandId, outletId, {
            menuItemId,
            addonId: a.addonId,
            isSingleSelect: a.isSingleSelect,
            min: a.min,
            max: a.max,
            isActive: true,
          });
          if (createdAddon && a.allowedItemIds && a.allowedItemIds.length > 0) {
            await updateMenuItemAddon(brandId, outletId, String(createdAddon._id), {
              allowedItemIds: a.allowedItemIds,
            });
          }
        }
      }
    }
    return updated;
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
