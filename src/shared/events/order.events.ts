import { EventEmitter } from 'events';

/**
 * Singleton order/KOT event bus.
 *
 * Usage — emit:
 *   orderEvents.emit('order.created', { orderId, outletId, brandId, ... });
 *
 * Usage — subscribe (e.g. in a WebSocket adapter):
 *   orderEvents.on('kot.status.updated', (payload) => io.to(outletId).emit(...));
 *
 * Events:
 *   order.created          — a new order was successfully created
 *   order.items.added      — additional items added to an existing order
 *   order.item.cancelled   — a specific item was cancelled mid-order
 *   order.item.updated     — item quantity / instruction changed
 *   order.cancelled        — entire order cancelled
 *   order.closed           — order marked complete & paid
 *   kot.created            — a new KOT (regular or void) was generated
 *   kot.status.updated     — KOT-level status changed (PENDING→PREPARING etc.)
 *   kot.item.status.updated — individual KOT item status changed
 */
class OrderEventBus extends EventEmitter { }

export const orderEvents = new OrderEventBus();
export default orderEvents;
