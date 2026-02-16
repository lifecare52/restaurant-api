import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import OutletEntity from '@modules/outlet/outlet.model';
import type { OutletCreateDTO, OutletUpdateDTO } from '@modules/outlet/outlet.types';

export const createOutlet = async (brandId: string, dto: OutletCreateDTO) => {
  const brand = await getBrandById(brandId);
  if (!brand) return null;
  const count = await OutletEntity.countDocuments({ brandId: new Types.ObjectId(brandId) });
  const limit = brand.plan?.outletLimit ?? 10;
  if (count >= limit) return null;
  return OutletEntity.create({
    brandId: new Types.ObjectId(brandId),
    basicInfo: dto.basicInfo,
    contact: dto.contact,
    settings: dto.settings,
  });
};

export const listOutlets = async (brandId: string) => {
  return OutletEntity.find({ brandId: new Types.ObjectId(brandId) });
};

export const getOutletById = async (brandId: string, outletId: string) => {
  return OutletEntity.findOne({
    _id: new Types.ObjectId(outletId),
    brandId: new Types.ObjectId(brandId),
  });
};

export const updateOutlet = async (brandId: string, outletId: string, dto: OutletUpdateDTO) => {
  return OutletEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(outletId), brandId: new Types.ObjectId(brandId) },
    { $set: dto },
    { new: true },
  );
};

export default {
  createOutlet,
  listOutlets,
  getOutletById,
  updateOutlet,
};
