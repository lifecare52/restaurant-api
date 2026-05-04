import BrandEntity from '@modules/brand/brand.model';
import type { BrandCreateDTO, BrandUpdateDTO } from '@modules/brand/brand.types';

export const createBrand = async (dto: BrandCreateDTO) => {
  const brand = await BrandEntity.create({
    name: dto.name,
    plan: dto.plan
  });
  return brand;
};

export const getBrandById = async (brandId: string) => {
  return BrandEntity.findOne({ _id: brandId, isDelete: false });
};

export const updateBrand = async (brandId: string, dto: BrandUpdateDTO) => {
  return BrandEntity.findOneAndUpdate({ _id: brandId, isDelete: false }, { $set: dto }, { new: true });
};

export const listBrands = async (options: {
  searchText?: string;
  page: number;
  limit: number;
}) => {
  const query: any = { isDelete: false };
  if (options.searchText) {
    query.name = { $regex: options.searchText, $options: 'i' };
  }
  const total = await BrandEntity.countDocuments(query);
  const brands = await BrandEntity.find(query)
    .sort({ createdAt: -1 })
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);
  return { brands, total };
};

export default {
  createBrand,
  getBrandById,
  updateBrand,
  listBrands
};
