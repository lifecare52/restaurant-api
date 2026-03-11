import { Schema, model } from 'mongoose';

import type { Measurement, MeasurementModel } from './measurement.types';

const MeasurementSchema = new Schema<Measurement>(
  {
    name: { type: String, required: true },
    measurementType: {
      type: String,
      required: true,
      enum: ['WEIGHT', 'VOLUME', 'QUANTITY', 'CUSTOM']
    },
    unit: { type: String, required: true },
    baseUnit: { type: String, required: true },
    conversionFactor: { type: Number, default: 1 },
    isDecimalAllowed: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

MeasurementSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDelete: false } }
);

export const MeasurementEntity = model<Measurement, MeasurementModel>(
  'Measurement',
  MeasurementSchema,
  'measurements'
);

export default MeasurementEntity;
