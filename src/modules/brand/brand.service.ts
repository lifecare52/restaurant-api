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
  return BrandEntity.findById(brandId);
};

export const updateBrand = async (brandId: string, dto: BrandUpdateDTO) => {
  return BrandEntity.findByIdAndUpdate(brandId, { $set: dto }, { new: true });
};

export default {
  createBrand,
  getBrandById,
  updateBrand
};
