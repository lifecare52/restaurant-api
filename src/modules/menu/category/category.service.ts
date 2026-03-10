import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import CategoryEntity from '@modules/menu/category/category.model';
import type { CategoryCreateDTO, CategoryUpdateDTO } from '@modules/menu/category/category.types';
import { getOutletById } from '@modules/outlet/outlet.service';

import type { PaginationQuery } from '@shared/interfaces/pagination';

export const createCategory = async (brandId: string, outletId: string, dto: CategoryCreateDTO) => {
  const brand = await getBrandById(brandId);
  if (!brand) return null;
  const outlet = await getOutletById(brandId, outletId);
  if (!outlet) return null;
  const existing = await CategoryEntity.findOne({
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    name: dto.name
  });
  if (existing) {
    if (existing.isDelete) {
      return CategoryEntity.findOneAndUpdate(
        { _id: existing._id },
        {
          $set: {
            onlineName: dto.onlineName,
            logo: dto.logo,
            isActive: dto.isActive ?? true,
            taxGroupId: dto.taxGroupId ? new Types.ObjectId(dto.taxGroupId) : null,
            isDelete: false
          }
        },
        { new: true }
      )
        .select('name onlineName logo isActive createdAt updatedAt')
        .lean();
    }
    throw { status: 409, code: 'DUPLICATE_CATEGORY', message: 'Category already exists' };
  }
  try {
    const created = await CategoryEntity.create({
      brandId: new Types.ObjectId(brandId),
      outletId: new Types.ObjectId(outletId),
      name: dto.name,
      onlineName: dto.onlineName,
      logo: dto.logo,
      isActive: dto.isActive ?? true,
      taxGroupId: dto.taxGroupId ? new Types.ObjectId(dto.taxGroupId) : null,
      isDelete: false
    });
    return CategoryEntity.findById(created._id)
      .select('name onlineName logo isActive taxGroupId createdAt updatedAt')
      .lean();
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_CATEGORY', message: 'Category already exists' };
    }
    throw err;
  }
};

export const listCategories = async (
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
    if (pagination.column === 'name' || pagination.column === 'onlineName') {
      filter[pagination.column] = { $regex: regex };
    } else {
      Object.assign(filter, {
        $or: [{ name: { $regex: regex } }, { onlineName: { $regex: regex } }]
      });
    }
  }
  const sortColumn = pagination.column || 'name';
  const sortOrder = pagination.order === 'DESC' ? -1 : 1;
  const [items, total] = await Promise.all([
    CategoryEntity.find(filter)
      .select('name onlineName logo isActive taxGroupId createdAt updatedAt')
      .lean()
      .sort({ [sortColumn]: sortOrder })
      .skip(skip)
      .limit(limit),
    CategoryEntity.countDocuments(filter)
  ]);
  return { items, total };
};

export const listActiveCategories = async (brandId: string, outletId: string) => {
  const items = await CategoryEntity.find({
    brandId: new Types.ObjectId(brandId),
    outletId: new Types.ObjectId(outletId),
    isDelete: false,
    isActive: true
  })
    .select('name')
    .lean()
    .sort({ name: 1 });
  return items;
};

export const getCategory = async (brandId: string, categoryId: string) => {
  return CategoryEntity.findOne({
    _id: new Types.ObjectId(categoryId),
    brandId: new Types.ObjectId(brandId),
    isDelete: false
  })
    .select('name onlineName logo isActive taxGroupId createdAt updatedAt')
    .lean();
};

export const updateCategory = async (
  brandId: string,
  categoryId: string,
  dto: CategoryUpdateDTO
) => {
  try {
    return await CategoryEntity.findOneAndUpdate(
      { _id: new Types.ObjectId(categoryId), brandId: new Types.ObjectId(brandId) },
      {
        $set: {
          ...dto,
          taxGroupId: dto.taxGroupId ? new Types.ObjectId(dto.taxGroupId) : undefined
        }
      },
      { new: true }
    )
      .select('name onlineName logo isActive taxGroupId createdAt updatedAt')
      .lean();
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 11000) {
      throw { status: 409, code: 'DUPLICATE_CATEGORY', message: 'Category already exists' };
    }
    throw err;
  }
};

export const deleteCategory = async (brandId: string, categoryId: string) => {
  return CategoryEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(categoryId), brandId: new Types.ObjectId(brandId) },
    { $set: { isDelete: true } },
    { new: true }
  );
};

export default {
  createCategory,
  listCategories,
  listActiveCategories,
  getCategory,
  updateCategory,
  deleteCategory
};
