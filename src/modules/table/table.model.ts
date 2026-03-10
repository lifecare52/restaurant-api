import { Schema, model, type Model } from 'mongoose';

import { type Table, TABLE_STATUS } from '@modules/table/table.types';

export type TableModel = Model<Table>;

const TableSchema = new Schema<Table>(
  {
    brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
    outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
    zoneId: { type: Schema.Types.ObjectId, ref: 'Zone', index: true },

    name: { type: String, required: true, trim: true },
    capacity: { type: Number, default: 4 },
    status: {
      type: String,
      enum: Object.values(TABLE_STATUS),
      default: TABLE_STATUS.AVAILABLE
    },

    isActive: { type: Boolean, default: true },
    isDelete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

TableSchema.index(
  { brandId: 1, outletId: 1, name: 1 },
  { unique: true, partialFilterExpression: { isDelete: false } }
);

export const TableEntity = model<Table, TableModel>('Table', TableSchema, 'tables');

export default TableEntity;
