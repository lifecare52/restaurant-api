import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import { getOutletById } from '@modules/outlet/outlet.service';

import type { PaginationQuery } from '@shared/interfaces/pagination';

import CategoryEntity from './category.model';

import type { CategoryCreateDTO, CategoryUpdateDTO } from './category.types';

export const createCategory = async (brandId: string, outletId: string, dto: CategoryCreateDTO) => {
  const brand = await getBrandById(brandId);
  if (!brand) return null;
  const outlet = await getOutletById(brandId, outletId);
  if (!outlet) return null;
  return CategoryEntity.create({
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    name: dto.name,
    onlineName: dto.onlineName,
    logo: dto.logo,
    isActive: dto.isActive ?? true,
    isDelete: false,
  });
};

export const listCategories = async (
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
    const regex = new RegExp(pagination.searchText, 'i');
    if (pagination.column) {
      filter[pagination.column] = { $regex: regex };
    } else {
      Object.assign(filter, {
        $or: [{ name: { $regex: regex } }, { onlineName: { $regex: regex } }],
      });
    }
  }
  const sortColumn = pagination.column || 'name';
  const sortOrder = pagination.order === 'DESC' ? -1 : 1;
  const [items, total] = await Promise.all([
    CategoryEntity.find(filter)
      .sort({ [sortColumn]: sortOrder })
      .skip(skip)
      .limit(limit),
    CategoryEntity.countDocuments(filter),
  ]);
  return { items, total };
};

export const getCategory = async (brandId: string, categoryId: string) => {
  return CategoryEntity.findOne({
    _id: new Types.ObjectId(categoryId),
    brandId: new Types.ObjectId(brandId),
    isDelete: false,
  });
};

export const updateCategory = async (
  brandId: string,
  categoryId: string,
  dto: CategoryUpdateDTO,
) => {
  return CategoryEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(categoryId), brandId: new Types.ObjectId(brandId) },
    { $set: dto },
    { new: true },
  );
};

export const deleteCategory = async (brandId: string, categoryId: string) => {
  return CategoryEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(categoryId), brandId: new Types.ObjectId(brandId) },
    { $set: { isDelete: true } },
    { new: true },
  );
};

export default {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
