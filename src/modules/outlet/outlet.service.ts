import { Types } from 'mongoose';

import { getBrandById } from '@modules/brand/brand.service';
import OutletEntity from '@modules/outlet/outlet.model';
import type { OutletCreateDTO, OutletUpdateDTO } from '@modules/outlet/outlet.types';

import { deleteFromS3 } from '@shared/utils/s3.util';
import { flattenObject } from '@shared/utils/object.util';

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
  return OutletEntity.find({ brandId: new Types.ObjectId(brandId), isDelete: false });
};

export const getOutletById = async (brandId: string, outletId: string) => {
  return OutletEntity.findOne({
    _id: new Types.ObjectId(outletId),
    brandId: new Types.ObjectId(brandId),
    isDelete: false,
  })
    .select('basicInfo contact settings isActive createdAt updatedAt')
    .lean();
};

export const updateOutlet = async (brandId: string, outletId: string, dto: OutletUpdateDTO) => {
  if (dto.basicInfo && dto.basicInfo.logo !== undefined) {
    const existing = await OutletEntity.findOne({
      _id: new Types.ObjectId(outletId),
      brandId: new Types.ObjectId(brandId),
      isDelete: false,
    });
    if (existing && existing.basicInfo?.logo && existing.basicInfo.logo !== dto.basicInfo.logo) {
      deleteFromS3(existing.basicInfo.logo).catch(err => {
        console.error('Failed to delete old outlet logo from S3:', err);
      });
    }
  }

  const flattenedUpdate = flattenObject(dto);

  return OutletEntity.findOneAndUpdate(
    {
      _id: new Types.ObjectId(outletId),
      brandId: new Types.ObjectId(brandId),
      isDelete: false,
    },
    { $set: flattenedUpdate },
    { new: true },
  );
};

export default {
  createOutlet,
  listOutlets,
  getOutletById,
  updateOutlet,
};
