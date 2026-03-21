import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import AddonEntity from '@modules/menu/addons/addon.model';
import type {
  AddonCreateDTO,
  AddonUpdateDTO,
  AddonItemUpdateDTO
} from '@modules/menu/addons/addon.types';
import { getOutletById } from '@modules/outlet/outlet.service';

import type { PaginationQuery } from '@shared/interfaces/pagination';

export const createAddon = async (brandId: string, outletId: string, dto: AddonCreateDTO) => {
  const brand = await getBrandById(brandId);
  if (!brand) return null;
  const outlet = await getOutletById(brandId, outletId);
  if (!outlet) return null;
  try {
    return await AddonEntity.create({
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      name: dto.name,
      items: (dto.items || []).map(i => ({
        name: i.name.trim(),
        price: i.price,
        sapCode: i.sapCode?.trim(),
        dietary: i.dietary,
        available: i.available ?? true
      })),
      isActive: dto.isActive ?? true,
      taxGroupId: dto.taxGroupId ? new Types.ObjectId(dto.taxGroupId) : null,
      isDelete: false
    });
  } catch (err) {
    const e = err as { code?: number; keyPattern?: Record<string, number> };
    if (e?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_ADDON', message: 'Addon already exists' };
    }
    throw err;
  }
};

export const listAddons = async (
  brandId: string,
  outletId: string,
  pagination: PaginationQuery
) => {
  const page = pagination.page && pagination.page > 0 ? pagination.page : 1;
  const limit = pagination.limit && pagination.limit > 0 ? pagination.limit : 20;
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  };
  if (pagination.searchText) {
    const regex = new RegExp(pagination.searchText, 'i');
    if (pagination.column) {
      filter[pagination.column] = { $regex: regex };
    } else {
      Object.assign(filter, {
        $or: [{ name: { $regex: regex } }]
      });
    }
  }
  const sortColumn = pagination.column || 'name';
  const sortOrder = pagination.order === 'DESC' ? -1 : 1;
  const [items, total] = await Promise.all([
    AddonEntity.find(filter)
      .sort({ [sortColumn]: sortOrder })
      .skip(skip)
      .limit(limit),
    AddonEntity.countDocuments(filter)
  ]);
  return { items, total };
};

export const listActiveAddons = async (brandId: string, outletId: string) => {
  const filter: Record<string, unknown> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
    isActive: true
  };
  const items = await AddonEntity.find(filter).select('name').sort({ name: 1 }).lean();
  return items;
};

export const getAddon = async (brandId: string, outletId: string, addonId: string) => {
  return AddonEntity.findOne({
    _id: new Types.ObjectId(addonId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false
  });
};

const applyAddonItemsDiff = (
  addon: typeof AddonEntity.prototype,
  items: AddonItemUpdateDTO[]
) => {
  const existingIds = new Set<string>(
    (addon.items || []).map((i: { _id?: Types.ObjectId }) => String(i._id))
  );

  const incomingIdSet = new Set<string>();
  const incomingById = new Map<string, AddonItemUpdateDTO>();
  const newItems: AddonItemUpdateDTO[] = [];

  for (const item of items || []) {
    const rawId = item._id ?? '';
    const id = rawId.trim();
    if (id && existingIds.has(id)) {
      incomingIdSet.add(id);
      incomingById.set(id, item);
    } else {
      newItems.push(item);
    }
  }

  for (const [id, item] of incomingById) {
    const sub = addon.items.id(id) as (typeof addon.items)[0] | null;
    if (!sub) continue;
    sub.name = item.name;
    sub.price = item.price;
    sub.sapCode = item.sapCode;
    sub.dietary = item.dietary;
    if (typeof item.available === 'boolean') {
      sub.available = item.available;
    }
  }

  for (const sub of [...addon.items]) {
    const id = String(sub._id);
    if (!incomingIdSet.has(id)) {
      sub.deleteOne();
    }
  }

  for (const item of newItems) {
    addon.items.push({
      name: item.name,
      price: item.price,
      sapCode: item.sapCode,
      dietary: item.dietary,
      available: item.available ?? true
    } as never);
  }
};

export const updateAddonItems = async (
  brandId: string,
  outletId: string,
  addonId: string,
  items: AddonItemUpdateDTO[]
) => {
  const addon = await AddonEntity.findOne({
    _id: new Types.ObjectId(addonId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId)
  });
  if (!addon) return null;

  applyAddonItemsDiff(addon, items);
  await addon.save();
  return addon;
};

export const updateAddon = async (
  brandId: string,
  outletId: string,
  addonId: string,
  dto: AddonUpdateDTO
) => {
  try {
    const addon = await AddonEntity.findOne({
      _id: new Types.ObjectId(addonId),
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId)
    });
    if (!addon) return null;

    if (dto.name !== undefined) {
      addon.name = dto.name;
    }
    if (dto.isActive !== undefined) {
      addon.isActive = dto.isActive;
    }
    if (dto.taxGroupId !== undefined) {
      addon.taxGroupId = dto.taxGroupId ? new Types.ObjectId(dto.taxGroupId) : undefined;
    }
    if (dto.items) {
      applyAddonItemsDiff(addon, dto.items);
    }

    await addon.save();
    return addon;
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_ADDON', message: 'Addon already exists' };
    }
    throw err;
  }
};

export const deleteAddon = async (brandId: string, outletId: string, addonId: string) => {
  return AddonEntity.findOneAndUpdate(
    {
      _id: new Types.ObjectId(addonId),
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId)
    },
    { $set: { isDelete: true } },
    { new: true }
  );
};

export default {
  createAddon,
  listAddons,
  listActiveAddons,
  getAddon,
  updateAddonItems,
  updateAddon,
  deleteAddon
};
