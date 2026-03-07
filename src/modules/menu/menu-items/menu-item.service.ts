import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import { getAddon } from '@modules/menu/addons/addon.service';
import { listActiveCategories } from '@modules/menu/category/category.service';
import {
  listMenuItemAddons,
  createMenuItemAddon,
  updateMenuItemAddon,
} from '@modules/menu/menu-item-addons/menu-item-addon.service';
import {
  listMenuItemVariants,
  createMenuItemVariant,
  getAllMenuItemVariants,
  updateMenuItemVariant,
  deleteMenuItemVariant,
} from '@modules/menu/menu-item-variants/menu-item-variant.service';
import type { MenuItemVariant } from '@modules/menu/menu-item-variants/menu-item-variant.types';
import MenuItemEntity from '@modules/menu/menu-items/menu-item.model';
import type {
  MenuItem,
  MenuItemCreateDTO,
  MenuItemUpdateDTO,
} from '@modules/menu/menu-items/menu-item.types';
import { getVariation, listActiveVariations } from '@modules/menu/variations/variation.service';
import { getOutletById } from '@modules/outlet/outlet.service';

import type { PaginationQuery } from '@shared/interfaces/pagination';

import CategoryEntity from '../category/category.model';

export const createMenuItem = async (brandId: string, outletId: string, dto: MenuItemCreateDTO) => {
  const brand = await getBrandById(brandId);
  if (!brand) return null;

  const outlet = await getOutletById(brandId, outletId);
  if (!outlet) return null;

  try {
    const normalizeAddonCreate = (
      arr:
        | Array<{ addonId: string; isSingleSelect?: boolean; min?: number | null; max?: number | null }>
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
      isMeasurementBased: v.isMeasurementBased,
      measurementConfig: v.measurementConfig,
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
      shortCodes: dto.shortCodes && dto.shortCodes.length > 0 ? dto.shortCodes.map(s => s.trim().toUpperCase()) : undefined,
      categoryId: new Types.ObjectId(dto.categoryId),

      dietary: dto.dietary,

      basePrice: dto.basePrice ?? null,
      costPrice: dto.costPrice ?? 0,

      isMeasurementBased: variationsInput.length > 0 ? false : dto.isMeasurementBased,
      measurementConfig: (variationsInput.length > 0 || !dto.measurementConfig)
        ? undefined
        : {
          ...dto.measurementConfig,
          measurementId: new Types.ObjectId(dto.measurementConfig.measurementId),
        },

      isVariation: variationsInput.length > 0,

      online: dto.online ?? false,
      takeAway: dto.takeAway ?? false,
      dineIn: dto.dineIn ?? false,

      isActive: dto.isActive ?? true,
      isDelete: false,
    });
    let result = created.toObject();

    if (variationsInput.length > 0) {
      const createdVariants = await Promise.all(
        variationsInput.map(v =>
          createMenuItemVariant(brandId, outletId, {
            menuItemId: String(created._id),
            variationId: v.variationId,
            basePrice: v.basePrice,
            costPrice: v.costPrice,
            isMeasurementBased: v.isMeasurementBased,
            measurementConfig: v.measurementConfig,
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
        if (!variantDocId || v.isMeasurementBased) continue;
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
    } else if (topLevelAddons.length > 0 && !dto.isMeasurementBased) {
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

    // Formatting measurement config is no longer needed since it's natively nested

    return result;
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
        const varObj = v as unknown as { toObject?: () => Record<string, unknown> } & Record<string, unknown>;
        const varRaw = varObj.toObject ? varObj.toObject() : varObj;
        return {
          variationId: String(v.variationId),
          name: variation?.name ?? '',
          basePrice: v.basePrice,
          costPrice: v.costPrice,
          isMeasurementBased: v.isMeasurementBased,
          measurementConfig: varRaw.measurementConfig,
          addons,
        };
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

  // Format measurement config is no longer needed since it's natively nested

  const diet = (base as { dietary?: string }).dietary;
  const dietaryShort =
    diet === 'VEG' ? 'V' : diet === 'NON_VEG' ? 'NV' : diet === 'EGG' ? 'E' : undefined;
  if (hasVariants) {
    return { ...base, dietaryShort, variations };
  }
  return { ...base, dietaryShort, variations: [], addons: topLevelAddons ?? [] };
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
    const updateData: Record<string, unknown> = { ...dto };
    let unsetData: Record<string, unknown> | undefined;

    if (dto.shortCodes) {
      if (dto.shortCodes.length > 0) {
        updateData.shortCodes = dto.shortCodes.map(s => s.trim().toUpperCase());
      } else {
        updateData.shortCodes = [];
      }
    }

    if (dto.variations && dto.variations.length > 0) {
      updateData.isMeasurementBased = false;
      delete updateData.measurementConfig;
      unsetData = { measurementConfig: 1 };
    } else if (dto.measurementConfig) {
      updateData.measurementConfig = {
        ...dto.measurementConfig,
        measurementId: new Types.ObjectId(dto.measurementConfig.measurementId),
      };
    }

    const updateQuery: Record<string, unknown> = {
      $set: updateData,
    };
    if (unsetData) {
      updateQuery.$unset = unsetData;
    }

    const updated = await MenuItemEntity.findOneAndUpdate(
      { _id: new Types.ObjectId(menuItemId), brandId: new Types.ObjectId(brandId) },
      updateQuery,
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
          min?: number | null;
          max?: number | null;
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

      const processedVariantIds = new Set<string>();

      for (const v of dto.variations) {
        let variantDocId: string | undefined = undefined;

        if (v.id) {
          const match = (variants.items || []).find(existing => String(existing._id) === v.id);
          if (match) {
            variantDocId = String(match._id);
          }
        }

        if (!variantDocId) {
          variantDocId = byVariationId.get(v.variationId);
        }

        if (!variantDocId) {
          // It's a new variation explicitly assigned to this menu item during an update call
          const exists = await getVariation(brandId, outletId, v.variationId);
          if (!exists) {
            throw { status: 404, code: 'VARIATION_NOT_FOUND', message: 'Variation not found' };
          }

          const newVariant = await createMenuItemVariant(brandId, outletId, {
            menuItemId,
            variationId: v.variationId,
            basePrice: v.basePrice,
            costPrice: v.costPrice,
            isMeasurementBased: v.isMeasurementBased,
            measurementConfig: v.measurementConfig,
            isActive: true,
            isDefault: false,
          });

          if (!newVariant) continue;
          variantDocId = String(newVariant._id);

          processedVariantIds.add(variantDocId);

          const addons = normalizeAddonUpdate(v.addons);
          for (const a of addons) {
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
          continue; // Finish processing this explicitly newly created variation
        }

        // Update variant details
        processedVariantIds.add(variantDocId);
        await updateMenuItemVariant(brandId, outletId, variantDocId, {
          variationId: v.variationId,
          basePrice: v.basePrice,
          costPrice: v.costPrice,
          isMeasurementBased: v.isMeasurementBased,
          measurementConfig: v.measurementConfig,
        });

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

      // NO-OP the untouched variations by deleting them since they aren't part of the DTO anymore
      for (const existing of variants.items || []) {
        if (!processedVariantIds.has(String(existing._id))) {
          await deleteMenuItemVariant(brandId, outletId, String(existing._id));
        }
      }
    } else if (dto.addons && dto.addons.length > 0 && !dto.isMeasurementBased) {
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
    // Recompute isVariation flag based on existing variants
    const variantCheck = await listMenuItemVariants(brandId, outletId, {
      page: 1,
      limit: 1,
      menuItemId,
      column: 'createdAt',
      order: 'ASC',
    });
    await MenuItemEntity.updateOne(
      { _id: new Types.ObjectId(menuItemId), brandId: new Types.ObjectId(brandId) },
      { $set: { isVariation: (variantCheck.items || []).length > 0 } },
    );
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

export const listMenuItemsCategoryWise = async (brandId: string, outletId: string) => {
  const categories = await CategoryEntity.find({
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  })
    .select('_id name isActive')
    .sort({ name: 1 });

  const result = await Promise.all(
    categories.map(async cat => {
      const items = await MenuItemEntity.find({
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        categoryId: cat._id,
        isDelete: false,
      })
        .select('_id name dietary isActive online takeAway dineIn')
        .sort({ name: 1 });
      return { category: cat, items };
    }),
  );

  return result.filter(r => r.items.length > 0);
};

export const deleteMenuItem = async (brandId: string, menuItemId: string) => {
  return MenuItemEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(menuItemId), brandId: new Types.ObjectId(brandId) },
    { $set: { isDelete: true } },
    { new: true },
  );
};

export interface BulkUpdateAvailabilityDTO {
  _id: string;
  online: boolean;
  takeAway: boolean;
  dineIn: boolean;
}

export const bulkUpdateMenuItemAvailability = async (
  brandId: string,
  outletId: string,
  dto: BulkUpdateAvailabilityDTO[],
) => {
  const bulkOps = dto.map(item => ({
    updateOne: {
      filter: {
        _id: new Types.ObjectId(item._id),
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        isDelete: false,
      },
      update: {
        $set: {
          online: item.online,
          takeAway: item.takeAway,
          dineIn: item.dineIn,
        },
      },
    },
  }));

  if (bulkOps.length === 0) return null;

  return MenuItemEntity.bulkWrite(bulkOps);
};

export const getAddonMapping = async (brandId: string, outletId: string) => {
  const categories = await listActiveCategories(brandId, outletId);

  const menuItems = await MenuItemEntity.find({
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isActive: true,
    isDelete: false,
  }).lean();

  const variants = (await getAllMenuItemVariants(
    brandId,
    outletId,
  )) as unknown as (MenuItemVariant & {
    _id: Types.ObjectId;
  })[];

  const variations = await listActiveVariations(brandId, outletId);
  const variationMap = new Map(variations.map(v => [v._id.toString(), v.name]));

  const itemsByCategoryId = new Map<
    string,
    {
      Name: string;
      menuItemId?: Types.ObjectId;
      menuItemVariantId?: Types.ObjectId;
      _id?: Types.ObjectId;
    }[]
  >();

  const variantsByItemId = new Map<string, (MenuItemVariant & { _id: Types.ObjectId })[]>();
  variants.forEach(v => {
    const itemId = v.menuItemId.toString();
    if (!variantsByItemId.has(itemId)) {
      variantsByItemId.set(itemId, []);
    }
    variantsByItemId.get(itemId)?.push(v);
  });

  menuItems.forEach(item => {
    const categoryId = item.categoryId.toString();
    if (!itemsByCategoryId.has(categoryId)) {
      itemsByCategoryId.set(categoryId, []);
    }

    if (!item.isVariation) {
      itemsByCategoryId.get(categoryId)?.push({
        Name: item.name,
        _id: item._id,
      });
    } else {
      const itemVariants = variantsByItemId.get(item._id.toString()) || [];
      itemVariants.forEach(v => {
        const variationName = variationMap.get(v.variationId.toString()) || 'Unknown';
        itemsByCategoryId.get(categoryId)?.push({
          Name: `${item.name} ${variationName}`,
          menuItemId: item._id,
          menuItemVariantId: v._id,
        });
      });
    }
  });

  return categories.map(cat => ({
    Category: cat.name,
    Items: itemsByCategoryId.get(cat._id.toString()) || [],
  }));
};

export const getAddonMappingAggregationV2 = async (
  brandId: string,
  outletId: string,
  filterAddonId?: string,
) => {
  const brandObjectId = new Types.ObjectId(brandId);
  const outletObjectId = new Types.ObjectId(outletId);
  const addonObjectId = filterAddonId ? new Types.ObjectId(filterAddonId) : null;

  return MenuItemEntity.aggregate([
    /* ---------------- MENU FILTER ---------------- */

    {
      $match: {
        brandId: brandObjectId,
        outletId: outletObjectId,
        isActive: true,
        isDelete: false,
      },
    },

    /* ---------------- CATEGORY ---------------- */

    {
      $lookup: {
        from: 'categories',
        localField: 'categoryId',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },

    /* ---------------- VARIANTS ---------------- */

    {
      $lookup: {
        from: 'menu_item_variants',
        localField: '_id',
        foreignField: 'menuItemId',
        as: 'variants',
      },
    },

    /* ---------------- VARIATION MASTER ---------------- */

    {
      $lookup: {
        from: 'variations',
        localField: 'variants.variationId',
        foreignField: '_id',
        as: 'variationDocs',
      },
    },

    /* ---------------- VARIANT ADDONS ---------------- */

    {
      $lookup: {
        from: 'menu_item_addons',
        localField: 'variants._id',
        foreignField: 'menuItemVariantId',
        as: 'variantAddons',
      },
    },

    /* ---------------- BUILD OUTPUT ITEMS ---------------- */

    {
      $project: {
        category: '$category.name',
        categoryId: '$category._id',

        items: {
          $cond: [
            /* ---------- NO VARIATION ---------- */

            { $eq: ['$isVariation', false] },

            [
              {
                menuId: '$_id',
                name: '$name',
              },
            ],

            /* ---------- HAS VARIATION ---------- */

            {
              $map: {
                input: '$variants',
                as: 'v',
                in: {
                  menuId: '$_id',
                  variationId: '$$v._id',

                  name: {
                    $concat: [
                      {
                        $let: {
                          vars: {
                            variationDoc: {
                              $first: {
                                $filter: {
                                  input: '$variationDocs',
                                  as: 'vd',
                                  cond: {
                                    $eq: ['$$vd._id', '$$v.variationId'],
                                  },
                                },
                              },
                            },
                          },
                          in: '$$variationDoc.name',
                        },
                      },
                      ' ',
                      '$name',
                    ],
                  },

                  addons: {
                    $filter: {
                      input: '$variantAddons',
                      as: 'va',
                      cond: {
                        $eq: ['$$va.menuItemVariantId', '$$v._id'],
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      },
    },

    /* ---------------- FILTER EXISTING ADDON ---------------- */

    ...(addonObjectId
      ? [
        {
          $addFields: {
            items: {
              $filter: {
                input: '$items',
                as: 'i',
                cond: {
                  $not: {
                    $in: [
                      addonObjectId,
                      {
                        $map: {
                          input: { $ifNull: ['$$i.addons', []] },
                          as: 'a',
                          in: '$$a.addonId',
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      ]
      : []),

    /* ---------------- GROUP CATEGORY ---------------- */

    {
      $group: {
        _id: '$categoryId',
        category: { $first: '$category' },
        items: { $push: '$items' },
      },
    },

    /* ---------------- FLATTEN ---------------- */

    {
      $project: {
        _id: 0,
        category: 1,
        categoryId: '$_id',
        items: {
          $reduce: {
            input: '$items',
            initialValue: [],
            in: { $concatArrays: ['$$value', '$$this'] },
          },
        },
      },
    },
    {
      $unset: 'items.addons',
    },
  ]);
};

export default {
  createMenuItem,
  listMenuItems,
  listMenuItemsWithNested,
  listMenuItemsCategoryWise,
  getMenuItem,
  getMenuItemWithNested,
  updateMenuItem,
  deleteMenuItem,
  bulkUpdateMenuItemAvailability,
  getAddonMapping,
  getAddonMappingAggregationV2,
};
