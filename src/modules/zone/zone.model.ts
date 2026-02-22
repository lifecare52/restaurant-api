import { Schema, model, type Model } from 'mongoose';

import type { Zone } from '@modules/zone/zone.types';

export type ZoneModel = Model<Zone>;

const ZoneSchema = new Schema<Zone>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true },

    name: { type: String, required: true, trim: true },

    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ZoneSchema.index(
  { brandId: 1, outletId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDelete: false } },
);

export const ZoneEntity = model<Zone, ZoneModel>('Zone', ZoneSchema, 'zones');

export default ZoneEntity;
