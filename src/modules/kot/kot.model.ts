import { Schema, model, type Model } from 'mongoose';
import { type KOT, type KOTItem, KOT_STATUS, KOT_TYPE, ITEM_STATUS } from '@modules/kot/kot.types';

export type KOTModel = Model<KOT>;
export type KOTItemModel = Model<KOTItem>;

// ─── KOT ─────────────────────────────────────────────────────────────────────

const KOTSchema = new Schema<KOT>(
    {
        brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
        outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
        orderId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Order' },
        kotNumber: { type: String, required: true, index: true },
        kotType: {
            type: Number,
            enum: Object.values(KOT_TYPE).filter((v) => !isNaN(Number(v))),
            default: KOT_TYPE.REGULAR,
        },
        waiterId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        tokenNo: { type: String, default: null },
        tableName: { type: String, default: null },
        status: {
            type: Number,
            enum: Object.values(KOT_STATUS).filter((v) => !isNaN(Number(v))),
            default: KOT_STATUS.PENDING,
        },
        isPrinted: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        isDelete: { type: Boolean, default: false },
    },
    { timestamps: true },
);

// Unique KOT number per outlet + kitchen display queries
KOTSchema.index({ brandId: 1, outletId: 1, kotNumber: 1 }, { unique: true });
KOTSchema.index({ brandId: 1, outletId: 1, status: 1 });        // KDS filter
KOTSchema.index({ brandId: 1, outletId: 1, orderId: 1 });       // fetch by order
KOTSchema.index({ brandId: 1, outletId: 1, createdAt: -1 });    // time-based ordering

export const KOTEntity = model<KOT, KOTModel>('KOT', KOTSchema, 'kots');

// ─── KOT Item ─────────────────────────────────────────────────────────────────

const KOTItemSchema = new Schema<KOTItem>(
    {
        brandId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Brand' },
        outletId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'Outlet' },
        kotId: { type: Schema.Types.ObjectId, required: true, index: true, ref: 'KOT' },
        orderItemId: { type: Schema.Types.ObjectId, required: true, ref: 'OrderItem' },
        quantity: { type: Number, required: true, min: 1 },
        // Per-item kitchen status
        itemStatus: {
            type: Number,
            enum: Object.values(ITEM_STATUS).filter((v) => !isNaN(Number(v))),
            default: ITEM_STATUS.PENDING,
        },
        preparedAt: { type: Date, default: null },
        servedAt: { type: Date, default: null },
        isActive: { type: Boolean, default: true },
        isDelete: { type: Boolean, default: false },
    },
    { timestamps: true },
);

// Lookup KOT items by status for kitchen display
KOTItemSchema.index({ kotId: 1, itemStatus: 1 });
KOTItemSchema.index({ orderItemId: 1 });

export const KOTItemEntity = model<KOTItem, KOTItemModel>('KOTItem', KOTItemSchema, 'kot_items');

export default {
    KOTEntity,
    KOTItemEntity,
};
