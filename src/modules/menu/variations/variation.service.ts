import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import { getOutletById } from '@modules/outlet/outlet.service';

import type { PaginationQuery } from '@shared/interfaces/pagination';

import { VariationEntity } from './variation.model';
import type { VariationCreateDTO, VariationUpdateDTO } from './variation.types';

export const createVariation = async (brandId: string, outletId: string, dto: VariationCreateDTO) => {
  const brand = await getBrandById(brandId);
  if (!brand) return null;

  const outlet = await getOutletById(brandId, outletId);
  if (!outlet) return null;

  try {
    return await VariationEntity.create({
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      name: dto.name,
      department: dto.department,
      isActive: dto.isActive ?? true,
      isDelete: false,
    });
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_VARIATION', message: 'Variation already exists' };
    }
    throw err;
  }
};

export const listVariations = async (
  brandId: string,
  outletId: string,
  pagination: PaginationQuery & { department?: string },
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
  if (pagination.department) {
    filter.department = pagination.department;
  }

  const sortColumn = pagination.column || 'name';
  const sortOrder = pagination.order === 'DESC' ? -1 : 1;

  const [items, total] = await Promise.all([
    VariationEntity.find(filter).sort({ [sortColumn]: sortOrder }).skip(skip).limit(limit),
    VariationEntity.countDocuments(filter),
  ]);

  return { items, total };
};

export const getVariation = async (brandId: string, outletId: string, variationId: string) => {
  return VariationEntity.findOne({
    _id: new Types.ObjectId(variationId),
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
  });
};

export const updateVariation = async (
  brandId: string,
  outletId: string,
  variationId: string,
  dto: VariationUpdateDTO,
) => {
  try {
    return await VariationEntity.findOneAndUpdate(
      {
        _id: new Types.ObjectId(variationId),
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
      },
      { $set: dto },
      { new: true },
    );
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_VARIATION', message: 'Variation already exists' };
    }
    throw err;
  }
};

export const deleteVariation = async (brandId: string, outletId: string, variationId: string) => {
  return VariationEntity.findOneAndUpdate(
    {
      _id: new Types.ObjectId(variationId),
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
    },
    { $set: { isDelete: true } },
    { new: true },
  );
};

export default {
  createVariation,
  listVariations,
  getVariation,
  updateVariation,
  deleteVariation,
};
