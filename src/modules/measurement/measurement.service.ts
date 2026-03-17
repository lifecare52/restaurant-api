import { Types, type FilterQuery, type SortOrder } from 'mongoose';

import MeasurementEntity from './measurement.model';

import type {
  MeasurementCreateDTO,
  MeasurementListQuery,
  MeasurementUpdateDTO
} from './measurement.types';

export const createMeasurement = async (dto: MeasurementCreateDTO) => {
  const measurement = new MeasurementEntity(dto);
  await measurement.save();
  const obj = measurement.toObject();
  const { isDelete, createdAt, updatedAt, isActive, ...rest } = obj;
  return rest;
};

export const listMeasurements = async (query: MeasurementListQuery) => {
  const { searchText, column = 'name', order = 'ASC' } = query;

  const match: FilterQuery<unknown> = { isDelete: false, isActive: true };

  if (searchText) {
    match.$or = [
      { name: { $regex: searchText, $options: 'i' } },
      { unit: { $regex: searchText, $options: 'i' } },
      { baseUnit: { $regex: searchText, $options: 'i' } }
    ];
  }

  const sort: Record<string, SortOrder> = {};
  sort[column] = order === 'ASC' ? 1 : -1;

  const items = await MeasurementEntity.find(match)
    .select('-isDelete -createdAt -updatedAt -isActive')
    .sort(sort);

  return { items };
};

export const getMeasurement = async (measurementId: string) => {
  return MeasurementEntity.findOne({
    _id: new Types.ObjectId(measurementId),
    isDelete: false,
    isActive: true
  }).select('-isDelete -createdAt -updatedAt -isActive');
};

export const updateMeasurement = async (measurementId: string, dto: MeasurementUpdateDTO) => {
  return MeasurementEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(measurementId) },
    { $set: dto },
    { new: true }
  ).select('-isDelete -createdAt -updatedAt -isActive');
};

export const deleteMeasurement = async (measurementId: string) => {
  return MeasurementEntity.findOneAndUpdate(
    { _id: new Types.ObjectId(measurementId) },
    { $set: { isDelete: true } },
    { new: true }
  ).select('-isDelete -createdAt -updatedAt -isActive');
};

export default {
  createMeasurement,
  listMeasurements,
  getMeasurement,
  updateMeasurement,
  deleteMeasurement
};
