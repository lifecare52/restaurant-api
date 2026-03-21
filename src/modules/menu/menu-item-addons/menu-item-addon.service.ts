import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import { getAddon } from '@modules/menu/addons/addon.service';
import { getMenuItemVariant } from '@modules/menu/menu-item-variants/menu-item-variant.service';
import { getMenuItem } from '@modules/menu/menu-items/menu-item.service';
import { getOutletById } from '@modules/outlet/outlet.service';

import type { Dietary } from '@shared/enum';

import MenuItemAddonEntity from './menu-item-addon.model';

import type {
  MenuItemAddonListQuery,
  MenuItemAddonFilterQuery,
  MenuItemAddonSyncDTO,
  MenuItemAddonSyncVariationDTO,
  MenuItemAddonSyncItemDTO
} from './menu-item-addon.types';
import type {
  MenuItemAddonCreateDTO,
  MenuItemAddonUpdateDTO,
  BulkMenuItemAddonCreateDTO
} from './menu-item-addon.types';

type ResolvedAddonItem = {
  _id: Types.ObjectId;
  name: string;
  price: number;
  sapCode?: string;
  dietary?: Dietary;
  available: boolean;
};

export const createMenuItemAddon = async (
  brandId: string,
  outletId: string,
  dto: MenuItemAddonCreateDTO
) => {
  const brand = await getBrandById(brandId);
  if (!brand) return null;

  const outlet = await getOutletById(brandId, outletId);
  if (!outlet) return null;

  const menuItem = await getMenuItem(brandId, dto.menuItemId);
  if (!menuItem || String(menuItem.outletId) !== outletId) return null;

  const addon = await getAddon(brandId, outletId, dto.addonId);
  if (!addon) return null;

  if (dto.menuItemVariantId) {
    const variant = await getMenuItemVariant(brandId, outletId, dto.menuItemVariantId);
    if (!variant || String(variant.menuItemId) !== String(dto.menuItemId)) return null;
  }

  try {
    const allowedIds = new Set((addon.items || []).map(i => String(i._id || '')).filter(Boolean));
    const allowedItemIds =
      (dto.allowedItemIds || [])
        .map(s => (s ?? '').trim())
        .filter(Boolean)
        .filter((id, idx, arr) => arr.findIndex(n => n.toLowerCase() === id.toLowerCase()) === idx)
        .filter(id => allowedIds.has(id)) || [];
    return await MenuItemAddonEntity.create({
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      menuItemId: new Types.ObjectId(dto.menuItemId),
      addonId: new Types.ObjectId(dto.addonId),
      menuItemVariantId: dto.menuItemVariantId
        ? new Types.ObjectId(dto.menuItemVariantId)
        : undefined,
      allowedItemIds: allowedItemIds.map(id => new Types.ObjectId(id)),
      isSingleSelect: dto.isSingleSelect,
      min: dto.min,
      max: dto.max,
      isActive: dto.isActive ?? true,
      isDelete: false
    });
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_MENU_ITEM_ADDON', message: 'Addon already attached' };
    }
    throw err;
  }
};

export const createBulkMenuItemAddons = async (
  brandId: string,
  outletId: string,
  dto: BulkMenuItemAddonCreateDTO
) => {
  const results = [];
  const errors = [];

  for (const item of dto.items) {
    try {
      const createDto: MenuItemAddonCreateDTO = {
        menuItemId: item.menuId,
        addonId: dto.addonId,
        allowedItemIds: dto.allowedItemsId,
        menuItemVariantId: item.variationId,
        isSingleSelect: dto.isSingleSelect,
        min: dto.min,
        max: dto.max,
        isActive: dto.isActive
      };

      const result = await createMenuItemAddon(brandId, outletId, createDto);
      if (result) {
        results.push(result);
      }
    } catch (err) {
      const e = err as { code?: string; message?: string };
      // Push errors to return later if needed, or just log
      errors.push({
        item,
        error: e.message || 'Unknown error',
        code: e.code
      });
    }
  }

  return { results, errors };
};

export const listMenuItemAddons = async (
  brandId: string,
  outletId: string,
  pagination: MenuItemAddonListQuery,
  filterInput: MenuItemAddonFilterQuery
) => {
  const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
  const limit = pagination.limit && pagination.limit > 0 ? pagination.limit : 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  };
  if (filterInput.menuItemId) filter.menuItemId = new Types.ObjectId(filterInput.menuItemId);
  if (filterInput.addonId) filter.addonId = new Types.ObjectId(filterInput.addonId);
  if (filterInput.menuItemVariantId)
    filter.menuItemVariantId = new Types.ObjectId(filterInput.menuItemVariantId);

  const sortColumn = pagination.column || 'createdAt';
  const sortOrder = pagination.order === 'DESC' ? -1 : 1;
  const [items, total] = await Promise.all([
    MenuItemAddonEntity.find(filter)
      .sort({ [sortColumn]: sortOrder })
      .skip(skip)
      .limit(limit),
    MenuItemAddonEntity.countDocuments(filter)
  ]);
  const enriched = await Promise.all(
    items.map(async m => {
      const addon = await getAddon(brandId, outletId, String(m.addonId));
      const addonItems: ResolvedAddonItem[] = (addon?.items ??
        []) as unknown as ResolvedAddonItem[];
      if (!m.allowedItemIds || m.allowedItemIds.length === 0) {
        return { ...m.toObject(), allowedItems: addonItems };
      }
      const idSet = new Set((m.allowedItemIds || []).map(id => String(id)));
      const filtered = addonItems.filter(ai => idSet.has(String(ai._id)));
      return { ...m.toObject(), allowedItems: filtered };
    })
  );
  return { items: enriched, total };
};

export const getMenuItemAddon = async (
  brandId: string,
  outletId: string,
  menuItemAddonId: string
) => {
  const doc = await MenuItemAddonEntity.findOne({
    _id: new Types.ObjectId(menuItemAddonId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  });
  if (!doc) return null;
  const addon = await getAddon(brandId, outletId, String(doc.addonId));
  const addonItems: ResolvedAddonItem[] = (addon?.items ?? []) as unknown as ResolvedAddonItem[];
  if (!doc.allowedItemIds || doc.allowedItemIds.length === 0) {
    return { ...doc.toObject(), allowedItems: addonItems };
  }
  const idSet = new Set((doc.allowedItemIds || []).map(id => String(id)));
  const filtered = addonItems.filter(ai => idSet.has(String(ai._id)));
  return { ...doc.toObject(), allowedItems: filtered };
};

export const updateMenuItemAddon = async (
  brandId: string,
  outletId: string,
  menuItemAddonId: string,
  dto: MenuItemAddonUpdateDTO
) => {
  try {
    let patch: Record<string, unknown> = { ...dto };
    if (dto.allowedItemIds) {
      // Normalize and validate against addon items
      const current = await MenuItemAddonEntity.findOne({
        _id: new Types.ObjectId(menuItemAddonId),
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        isDelete: false
      });
      if (current) {
        const addon = await getAddon(brandId, outletId, String(current.addonId));
        if (addon) {
          const allowedIds = new Set(
            (addon.items || []).map(i => String(i._id || '')).filter(Boolean)
          );
          const allowedItemIds =
            (dto.allowedItemIds || [])
              .map(s => (s ?? '').trim())
              .filter(Boolean)
              .filter(
                (id, idx, arr) => arr.findIndex(n => n.toLowerCase() === id.toLowerCase()) === idx
              )
              .filter(id => allowedIds.has(id)) || [];
          patch.allowedItemIds = allowedItemIds.map(id => new Types.ObjectId(id));
        }
      }
    }
    const updated = await MenuItemAddonEntity.findOneAndUpdate(
      {
        _id: new Types.ObjectId(menuItemAddonId),
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId)
      },
      { $set: patch },
      { new: true }
    );
    if (!updated) return updated;
    const addon = await getAddon(brandId, outletId, String(updated.addonId));
    const addonItems: ResolvedAddonItem[] = (addon?.items ?? []) as unknown as ResolvedAddonItem[];
    if (!updated.allowedItemIds || updated.allowedItemIds.length === 0) {
      return { ...updated.toObject(), allowedItems: addonItems };
    }
    const idSet = new Set((updated.allowedItemIds || []).map(id => String(id)));
    const filtered = addonItems.filter(ai => idSet.has(String(ai._id)));
    return { ...updated.toObject(), allowedItems: filtered };
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_MENU_ITEM_ADDON', message: 'Addon already attached' };
    }
    throw err;
  }
};

export const deleteMenuItemAddon = async (
  brandId: string,
  outletId: string,
  menuItemAddonId: string
) => {
  return MenuItemAddonEntity.findOneAndUpdate(
    {
      _id: new Types.ObjectId(menuItemAddonId),
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId)
    },
    { $set: { isDelete: true } },
    { new: true }
  );
};

type UpdateMenuItemAddonsSoftInput = {
  brandId: string;
  outletId: string;
  menuItemId: string;
  addons?: MenuItemAddonSyncItemDTO[];
};

export const updateMenuItemAddonsSoft = async ({
  brandId,
  outletId,
  menuItemId,
  addons
}: UpdateMenuItemAddonsSoftInput) => {
  const brandObjectId = new Types.ObjectId(brandId);
  const outletObjectId = new Types.ObjectId(outletId);
  const menuItemObjectId = new Types.ObjectId(menuItemId);

  if (addons === undefined) {
    return null;
  }

  const bulkOps = [] as Parameters<typeof MenuItemAddonEntity.bulkWrite>[0];

  const incomingMap = new Map<string, MenuItemAddonSyncItemDTO>();
  const incomingIds = new Set<string>();

  for (const a of addons || []) {
    const raw = a.addonId ?? '';
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!incomingMap.has(key)) {
      incomingMap.set(key, {
        addonId: trimmed,
        allowedItemsId: a.allowedItemsId,
        isSingleSelect: a.isSingleSelect,
        min: a.min,
        max: a.max
      });
      incomingIds.add(key);
    }
  }

  if (incomingIds.size === 0) {
    bulkOps.push({
      updateMany: {
        filter: {
          brandId: brandObjectId,
          outletId: outletObjectId,
          menuItemId: menuItemObjectId,
          menuItemVariantId: { $exists: false },
          isDelete: false
        },
        update: { $set: { isDelete: true } }
      }
    });
  } else {
    const existing = await MenuItemAddonEntity.find({
      brandId: brandObjectId,
      outletId: outletObjectId,
      menuItemId: menuItemObjectId,
      menuItemVariantId: { $exists: false },
      isDelete: false
    }).lean();

    const existingIds = new Set(
      existing.map(doc => String(doc.addonId).toLowerCase())
    );

    const toAdd = [...incomingIds].filter(id => !existingIds.has(id));
    const toDelete = [...existingIds].filter(id => !incomingIds.has(id));
    const toUpdate = [...incomingIds].filter(id => existingIds.has(id));

    for (const id of toAdd) {
      const src = incomingMap.get(id);
      if (!src || !src.addonId) continue;

      const addon = await getAddon(brandId, outletId, src.addonId);
      let allowedItemIds: Types.ObjectId[] = [];
      if (addon) {
        const allowedIds = new Set(
          (addon.items || []).map(i => String(i._id || '')).filter(Boolean)
        );
        const filtered =
          (src.allowedItemsId || [])
            .map((s: string | undefined | null) => (s ?? '').trim())
            .filter((value: string) => Boolean(value))
            .filter((val: string, idx: number, arr: string[]) => {
              const lowerVal = val.toLowerCase();
              return (
                arr.findIndex((n: string) => n.toLowerCase() === lowerVal) === idx
              );
            })
            .filter((val: string) => allowedIds.has(val)) || [];
        allowedItemIds = filtered.map(val => new Types.ObjectId(val));
      }

      bulkOps.push({
        insertOne: {
          document: {
            brandId: brandObjectId,
            outletId: outletObjectId,
            menuItemId: menuItemObjectId,
            addonId: new Types.ObjectId(src.addonId),
            allowedItemIds,
            isSingleSelect: src.isSingleSelect ?? false,
            min: src.min ?? null,
            max: src.max ?? null,
            isActive: true,
            isDelete: false
          }
        }
      });
    }

    for (const id of toUpdate) {
      const src = incomingMap.get(id);
      if (!src || !src.addonId) continue;

      const addon = await getAddon(brandId, outletId, src.addonId);
      let allowedItemIds: Types.ObjectId[] = [];
      if (addon) {
        const allowedIds = new Set(
          (addon.items || []).map(i => String(i._id || '')).filter(Boolean)
        );
        const filtered =
          (src.allowedItemsId || [])
            .map((s: string | undefined | null) => (s ?? '').trim())
            .filter((value: string) => Boolean(value))
            .filter((val: string, idx: number, arr: string[]) => {
              const lowerVal = val.toLowerCase();
              return (
                arr.findIndex((n: string) => n.toLowerCase() === lowerVal) === idx
              );
            })
            .filter((val: string) => allowedIds.has(val)) || [];
        allowedItemIds = filtered.map(val => new Types.ObjectId(val));
      }

      bulkOps.push({
        updateMany: {
          filter: {
            brandId: brandObjectId,
            outletId: outletObjectId,
            menuItemId: menuItemObjectId,
            menuItemVariantId: { $exists: false },
            addonId: new Types.ObjectId(src.addonId),
            isDelete: false
          },
          update: {
            $set: {
              allowedItemIds,
              isSingleSelect: src.isSingleSelect ?? false,
              min: src.min ?? null,
              max: src.max ?? null
            }
          }
        }
      });
    }

    if (toDelete.length > 0) {
      bulkOps.push({
        updateMany: {
          filter: {
            brandId: brandObjectId,
            outletId: outletObjectId,
            menuItemId: menuItemObjectId,
            menuItemVariantId: { $exists: false },
            addonId: { $in: toDelete.map(id => new Types.ObjectId(id)) },
            isDelete: false
          },
          update: { $set: { isDelete: true } }
        }
      });
    }
  }

  if (bulkOps.length === 0) {
    return null;
  }

  return MenuItemAddonEntity.bulkWrite(bulkOps);
};

export const updateMenuItemAddons = async (input: MenuItemAddonSyncDTO) => {
  const brandObjectId = new Types.ObjectId(input.brandId);
  const outletObjectId = new Types.ObjectId(input.outletId);
  const menuItemObjectId = new Types.ObjectId(input.menuItemId);

  const bulkOps = [] as Parameters<typeof MenuItemAddonEntity.bulkWrite>[0];

  if (!input.isVariation) {
    return updateMenuItemAddonsSoft({
      brandId: input.brandId,
      outletId: input.outletId,
      menuItemId: input.menuItemId,
      addons: input.addons
    });
  } else {
    const variations = input.variations || [];
    if (variations.length === 0) {
      return null;
    }

    const variationsToProcess = variations.filter(v => v.addons !== undefined);
    if (variationsToProcess.length === 0) {
      return null;
    }

    const variantObjectIds = variationsToProcess.map(
      v => new Types.ObjectId(v.menuItemVariantId)
    );

    const existing = await MenuItemAddonEntity.find({
      brandId: brandObjectId,
      outletId: outletObjectId,
      menuItemId: menuItemObjectId,
      menuItemVariantId: { $in: variantObjectIds },
      isDelete: false
    }).lean();

    const existingByVariant = new Map<string, string[]>();
    for (const doc of existing) {
      const variantKey = String(doc.menuItemVariantId);
      const list = existingByVariant.get(variantKey) || [];
      list.push(String(doc.addonId).toLowerCase());
      existingByVariant.set(variantKey, list);
    }

    for (const variation of variationsToProcess) {
      const variantIdStr = variation.menuItemVariantId;
      const variantObjectId = new Types.ObjectId(variantIdStr);

      const incomingMap = new Map<string, MenuItemAddonSyncItemDTO>();
      const incomingIds = new Set<string>();

      for (const a of variation.addons || []) {
        const raw = a.addonId ?? '';
        const trimmed = raw.trim();
        if (!trimmed) continue;
        const key = trimmed.toLowerCase();
        if (!incomingMap.has(key)) {
          incomingMap.set(key, {
            addonId: trimmed,
            allowedItemsId: a.allowedItemsId,
            isSingleSelect: a.isSingleSelect,
            min: a.min,
            max: a.max
          });
          incomingIds.add(key);
        }
      }

      if (incomingIds.size === 0) {
        bulkOps.push({
          updateMany: {
            filter: {
              brandId: brandObjectId,
              outletId: outletObjectId,
              menuItemId: menuItemObjectId,
              menuItemVariantId: variantObjectId,
              isDelete: false
            },
            update: { $set: { isDelete: true } }
          }
        });
        continue;
      }

      const existingIds = new Set(existingByVariant.get(variantIdStr) || []);

      const toAdd = [...incomingIds].filter(id => !existingIds.has(id));
      const toDelete = [...existingIds].filter(id => !incomingIds.has(id));
      const toUpdate = [...incomingIds].filter(id => existingIds.has(id));

      for (const id of toAdd) {
        const src = incomingMap.get(id);
        if (!src || !src.addonId) continue;

        const addon = await getAddon(input.brandId, input.outletId, src.addonId);
        let allowedItemIds: Types.ObjectId[] = [];
        if (addon) {
          const allowedIds = new Set(
            (addon.items || []).map(i => String(i._id || '')).filter(Boolean)
          );
          const filtered =
            (src.allowedItemsId || [])
              .map((s: string | undefined | null) => (s ?? '').trim())
              .filter((value: string) => Boolean(value))
              .filter((val: string, idx: number, arr: string[]) => {
                const lowerVal = val.toLowerCase();
                return (
                  arr.findIndex((n: string) => n.toLowerCase() === lowerVal) === idx
                );
              })
              .filter((val: string) => allowedIds.has(val)) || [];
          allowedItemIds = filtered.map(val => new Types.ObjectId(val));
        }

        bulkOps.push({
          insertOne: {
            document: {
              brandId: brandObjectId,
              outletId: outletObjectId,
              menuItemId: menuItemObjectId,
              menuItemVariantId: variantObjectId,
              addonId: new Types.ObjectId(src.addonId),
              allowedItemIds,
              isSingleSelect: src.isSingleSelect ?? false,
              min: src.min ?? null,
              max: src.max ?? null,
              isActive: true,
              isDelete: false
            }
          }
        });
      }

      for (const id of toUpdate) {
        const src = incomingMap.get(id);
        if (!src || !src.addonId) continue;

        const addon = await getAddon(input.brandId, input.outletId, src.addonId);
        let allowedItemIds: Types.ObjectId[] = [];
        if (addon) {
          const allowedIds = new Set(
            (addon.items || []).map(i => String(i._id || '')).filter(Boolean)
          );
          const filtered =
            (src.allowedItemsId || [])
              .map((s: string | undefined | null) => (s ?? '').trim())
              .filter((value: string) => Boolean(value))
              .filter((val: string, idx: number, arr: string[]) => {
                const lowerVal = val.toLowerCase();
                return (
                  arr.findIndex((n: string) => n.toLowerCase() === lowerVal) === idx
                );
              })
              .filter((val: string) => allowedIds.has(val)) || [];
          allowedItemIds = filtered.map(val => new Types.ObjectId(val));
        }

        bulkOps.push({
          updateMany: {
            filter: {
              brandId: brandObjectId,
              outletId: outletObjectId,
              menuItemId: menuItemObjectId,
              menuItemVariantId: variantObjectId,
              addonId: new Types.ObjectId(src.addonId),
              isDelete: false
            },
            update: {
              $set: {
                allowedItemIds,
                isSingleSelect: src.isSingleSelect ?? false,
                min: src.min ?? null,
                max: src.max ?? null
              }
            }
          }
        });
      }

      if (toDelete.length > 0) {
        bulkOps.push({
          updateMany: {
            filter: {
              brandId: brandObjectId,
              outletId: outletObjectId,
              menuItemId: menuItemObjectId,
              menuItemVariantId: variantObjectId,
              addonId: { $in: toDelete.map(id => new Types.ObjectId(id)) },
              isDelete: false
            },
            update: { $set: { isDelete: true } }
          }
        });
      }
    }
  }

  if (bulkOps.length === 0) {
    return null;
  }

  return MenuItemAddonEntity.bulkWrite(bulkOps);
};

export default {
  createMenuItemAddon,
  listMenuItemAddons,
  getMenuItemAddon,
  updateMenuItemAddon,
  deleteMenuItemAddon,
  updateMenuItemAddonsSoft,
  updateMenuItemAddons
};
