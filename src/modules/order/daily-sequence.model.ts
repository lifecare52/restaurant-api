import { Schema, model, type Model, type Types } from 'mongoose';

export type DailySequenceType = 'ORDER' | 'KOT' | 'TOKEN';

export interface DailySequence {
  brandId: Types.ObjectId;
  outletId: Types.ObjectId;
  date: string;
  type: DailySequenceType;
  seq: number;
}

export type DailySequenceModel = Model<DailySequence>;

const DailySequenceSchema = new Schema<DailySequence>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, ref: 'Outlet' },
    date: { type: String, required: true },
    type: { type: String, enum: ['ORDER', 'KOT', 'TOKEN'], required: true, default: 'TOKEN' },
    seq: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Unique sequencing per outlet, per day, per type
DailySequenceSchema.index({ brandId: 1, outletId: 1, date: 1, type: 1 }, { unique: true });

export const DailySequenceEntity = model<DailySequence, DailySequenceModel>(
  'DailySequence',
  DailySequenceSchema,
  'daily_sequences'
);

export default DailySequenceEntity;
