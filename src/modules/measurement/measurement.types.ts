import { Document, Model, Types } from 'mongoose';

export type MeasurementType = 'WEIGHT' | 'VOLUME' | 'QUANTITY' | 'CUSTOM';

export interface Measurement extends Document {
  name: string;
  measurementType: MeasurementType;
  unit: string;
  baseUnit: string;
  conversionFactor: number;
  isDecimalAllowed: boolean;
  isActive: boolean;
  isDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type MeasurementModel = Model<Measurement>;

export interface MeasurementCreateDTO {
  name: string;
  measurementType: MeasurementType;
  unit: string;
  baseUnit: string;
  conversionFactor?: number;
  isDecimalAllowed?: boolean;
  isActive?: boolean;
}

export interface MeasurementUpdateDTO {
  name?: string;
  measurementType?: MeasurementType;
  unit?: string;
  baseUnit?: string;
  conversionFactor?: number;
  isDecimalAllowed?: boolean;
  isActive?: boolean;
}

export interface MeasurementListQuery {
  page?: number;
  limit?: number;
  searchText?: string;
  column?: string;
  order?: 'ASC' | 'DESC';
  isActive?: boolean;
}
