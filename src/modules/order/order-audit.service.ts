import { Types } from 'mongoose';
import OrderAuditLogEntity, { type OrderAuditAction } from '@modules/order/order-audit.model';

interface LogParams {
    brandId: string;
    outletId: string;
    orderId: string;
    action: OrderAuditAction;
    performedBy?: string | null;
    metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget audit log writer.
 * Errors are silently swallowed so audit failures never break business logic.
 */
export const logOrderAction = (params: LogParams): void => {
    OrderAuditLogEntity.create({
        brandId: new Types.ObjectId(params.brandId),
        outletId: new Types.ObjectId(params.outletId),
        orderId: new Types.ObjectId(params.orderId),
        action: params.action,
        performedBy: params.performedBy ? new Types.ObjectId(params.performedBy) : null,
        metadata: params.metadata ?? {},
        timestamp: new Date(),
    }).catch((err) => {
        // Audit failures should never crash the request pipeline
        console.error('[AuditLog] Failed to write audit entry:', err?.message);
    });
};
