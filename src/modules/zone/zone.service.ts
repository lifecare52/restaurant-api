import { Types } from 'mongoose';

import ZoneEntity from '@modules/zone/zone.model';
import type { ZoneCreateDTO, ZoneUpdateDTO, ZoneListQuery, Zone } from '@modules/zone/zone.types';
import type { FilterQuery } from 'mongoose';

export const createZone = async (brandId: string, outletId: string, dto: ZoneCreateDTO) => {
  try {
    const created = await ZoneEntity.create({
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      name: dto.name,
      isActive: dto.isActive ?? true,
      isDelete: false,
    });
    return created.toObject();
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_ZONE', message: 'Zone name already exists' };
    }
    throw err;
  }
};

export const listZones = async (brandId: string, outletId: string, query: ZoneListQuery) => {
  const page = query.page && query.page > 0 ? query.page : 1;
  const limit = query.limit && query.limit > 0 ? query.limit : 20;
  const skip = (page - 1) * limit;

  const filter: FilterQuery<Zone> = {
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  };

  if (query.searchText) {
    filter.name = { $regex: new RegExp(query.searchText, 'i') };
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  const sortColumn = query.column || 'name';
  const sortOrder = query.order === 'DESC' ? -1 : 1;

  const [items, total] = await Promise.all([
    ZoneEntity.find(filter)
      .sort({ [sortColumn]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean(),
    ZoneEntity.countDocuments(filter),
  ]);

  return { items, total };
};

export const listActiveZones = async (brandId: string, outletId: string) => {
  const items = await ZoneEntity.find({
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
    isActive: true,
  })
    .select('name')
    .lean()
    .sort({ name: 1 });
  return items;
};

export const getZone = async (brandId: string, outletId: string, zoneId: string) => {
  return ZoneEntity.findOne({
    _id: new Types.ObjectId(zoneId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  }).lean();
};

export const updateZone = async (
  brandId: string,
  outletId: string,
  zoneId: string,
  dto: ZoneUpdateDTO,
) => {
  try {
    const updated = await ZoneEntity.findOneAndUpdate(
      {
        _id: new Types.ObjectId(zoneId),
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        isDelete: false,
      },
      { $set: dto },
      { new: true },
    );
    return updated;
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_ZONE', message: 'Zone name already exists' };
    }
    throw err;
  }
};

export const deleteZone = async (brandId: string, outletId: string, zoneId: string) => {
  return ZoneEntity.findOneAndUpdate(
    {
      _id: new Types.ObjectId(zoneId),
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      isDelete: false,
    },
    { $set: { isDelete: true } },
    { new: true },
  );
};
