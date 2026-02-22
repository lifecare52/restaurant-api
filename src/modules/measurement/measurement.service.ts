import { Types } from 'mongoose';

import MeasurementEntity from './measurement.model';

import type {
  MeasurementCreateDTO,
  MeasurementListQuery,
  MeasurementUpdateDTO,
} from './measurement.types';

export const createMeasurement = async (dto: MeasurementCreateDTO) => {
  const measurement = new MeasurementEntity(dto);
  return measurement.save();
};

export const listMeasurements = async (query: MeasurementListQuery) => {
  const { page = 1, limit = 20, searchText, column = 'name', order = 'ASC', isActive } = query;

  const match: any = { isDelete: false };

  if (isActive !== undefined) {
    match.isActive = isActive;
  }

  if (searchText) {
    match.$or = [
      { name: { $regex: searchText, $options: 'i' } },
      { unit: { $regex: searchText, $options: 'i' } },
      { baseUnit: { $regex: searchText, $options: 'i' } },
    ];
  }

  const sort: any = {};
  sort[column] = order === 'ASC' ? 1 : -1;

  const [result] = await MeasurementEntity.aggregate([
    { $match: match },
    { $sort: sort },
    {
      $facet: {
        items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  return {
    items: result.items,
    total: result.total[0] ? result.total[0].count : 0,
  };
};

export const getMeasurement = async (measurementId: string) => {
  return MeasurementEntity.findOne({
    _id: new Types.ObjectId(measurementId),
    isDelete: false,
  });
};

export const updateMeasurement = async (measurementId: string, dto: MeasurementUpdateDTO) => {
  return MeasurementEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(measurementId) },
    { $set: dto },
    { new: true },
  );
};

export const deleteMeasurement = async (measurementId: string) => {
  return MeasurementEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(measurementId) },
    { $set: { isDelete: true } },
    { new: true },
  );
};

export default {
  createMeasurement,
  listMeasurements,
  getMeasurement,
  updateMeasurement,
  deleteMeasurement,
};
