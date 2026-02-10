import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import { getOutletById } from '@modules/outlet/outlet.service';
import { getMenuItem } from '@modules/menu/menu-items/menu-item.service';
import { getAddon } from '@modules/menu/addons/addon.service';
import { getMenuItemVariant } from '@modules/menu/menu-item-variants/menu-item-variant.service';

import type { PaginationQuery } from '@shared/interfaces/pagination';

import MenuItemAddonEntity from './menu-item-addon.model';
import type { MenuItemAddonCreateDTO, MenuItemAddonUpdateDTO } from './menu-item-addon.types';

type ResolvedAddonItem = {
  _id: Types.ObjectId;
  name: string;
  price: number;
  sapCode?: string;
  dietary?: 'VEG' | 'NON_VEG' | 'EGG';
  available: boolean;
};

export const createMenuItemAddon = async (brandId: string, outletId: string, dto: MenuItemAddonCreateDTO) => {
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
    const allowedIds = new Set(
      (addon.items || []).map(i => String(i._id || '')).filter(Boolean),
    );
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
      menuItemVariantId: dto.menuItemVariantId ? new Types.ObjectId(dto.menuItemVariantId) : undefined,
      allowedItemIds: allowedItemIds.map(id => new Types.ObjectId(id)),
      isSingleSelect: dto.isSingleSelect,
      min: dto.min,
      max: dto.max,
      isActive: dto.isActive ?? true,
      isDelete: false,
    });
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_MENU_ITEM_ADDON', message: 'Addon already attached' };
    }
    throw err;
  }
};

export const listMenuItemAddons = async (
  brandId: string,
  outletId: string,
  pagination: PaginationQuery,
  filterInput: { menuItemId?: string; addonId?: string; menuItemVariantId?: string },
) => {
  const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
  const limit = pagination.limit && pagination.limit > 0 ? pagination.limit : 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  };
  if (filterInput.menuItemId) filter.menuItemId = new Types.ObjectId(filterInput.menuItemId);
  if (filterInput.addonId) filter.addonId = new Types.ObjectId(filterInput.addonId);
  if (filterInput.menuItemVariantId) filter.menuItemVariantId = new Types.ObjectId(filterInput.menuItemVariantId);

  const sortColumn = pagination.column || 'createdAt';
  const sortOrder = pagination.order === 'DESC' ? -1 : 1;
  const [items, total] = await Promise.all([
    MenuItemAddonEntity.find(filter).sort({ [sortColumn]: sortOrder }).skip(skip).limit(limit),
    MenuItemAddonEntity.countDocuments(filter),
  ]);
  const enriched = await Promise.all(
    items.map(async m => {
      const addon = await getAddon(brandId, outletId, String(m.addonId));
      const addonItems: ResolvedAddonItem[] = ((addon?.items ?? []) as unknown as ResolvedAddonItem[]);
      if (!m.allowedItemIds || m.allowedItemIds.length === 0) {
        return { ...m.toObject(), allowedItems: addonItems };
      }
      const idSet = new Set((m.allowedItemIds || []).map(id => String(id)));
      const filtered = addonItems.filter(ai => idSet.has(String(ai._id)));
      return { ...m.toObject(), allowedItems: filtered };
    }),
  );
  return { items: enriched, total };
};

export const getMenuItemAddon = async (brandId: string, outletId: string, menuItemAddonId: string) => {
  const doc = await MenuItemAddonEntity.findOne({
    _id: new Types.ObjectId(menuItemAddonId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  });
  if (!doc) return null;
  const addon = await getAddon(brandId, outletId, String(doc.addonId));
  const addonItems: ResolvedAddonItem[] = ((addon?.items ?? []) as unknown as ResolvedAddonItem[]);
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
  dto: MenuItemAddonUpdateDTO,
) => {
  try {
    let patch: Record<string, unknown> = { ...dto };
    if (dto.allowedItemIds) {
      // Normalize and validate against addon items
      const current = await MenuItemAddonEntity.findOne({
        _id: new Types.ObjectId(menuItemAddonId),
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        isDelete: false,
      });
      if (current) {
        const addon = await getAddon(brandId, outletId, String(current.addonId));
        if (addon) {
          const allowedIds = new Set(
            (addon.items || []).map(i => String(i._id || '')).filter(Boolean),
          );
          const allowedItemIds =
            (dto.allowedItemIds || [])
              .map(s => (s ?? '').trim())
              .filter(Boolean)
              .filter((id, idx, arr) => arr.findIndex(n => n.toLowerCase() === id.toLowerCase()) === idx)
              .filter(id => allowedIds.has(id)) || [];
          patch.allowedItemIds = allowedItemIds.map(id => new Types.ObjectId(id));
        }
      }
    }
    const updated = await MenuItemAddonEntity.findOneAndUpdate(
      { _id: new Types.ObjectId(menuItemAddonId), brandId: new Types.ObjectId(brandId), outletId: new Types.ObjectId(outletId) },
      { $set: patch },
      { new: true },
    );
    if (!updated) return updated;
    const addon = await getAddon(brandId, outletId, String(updated.addonId));
    const addonItems: ResolvedAddonItem[] = ((addon?.items ?? []) as unknown as ResolvedAddonItem[]);
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

export const deleteMenuItemAddon = async (brandId: string, outletId: string, menuItemAddonId: string) => {
  return MenuItemAddonEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(menuItemAddonId), brandId: new Types.ObjectId(brandId), outletId: new Types.ObjectId(outletId) },
    { $set: { isDelete: true } },
    { new: true },
  );
};

export default {
  createMenuItemAddon,
  listMenuItemAddons,
  getMenuItemAddon,
  updateMenuItemAddon,
  deleteMenuItemAddon,
};
