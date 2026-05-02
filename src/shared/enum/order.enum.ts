export enum ORDER_TYPE {
  DINE_IN = 1,
  TAKEAWAY = 2,
  DELIVERY = 3
}

export enum ORDER_STATUS {
  OPEN = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
  CANCELLED = 4
}

export enum PAYMENT_STATUS {
  UNPAID = 1,
  PARTIAL = 2,
  PAID = 3,
  REFUNDED = 4
}

export enum KOT_STATUS {
  PENDING = 1,
  PREPARING = 2,
  READY = 3,
  SERVED = 4,
  CANCELLED = 5
}

/** Per-item kitchen lifecycle status */
export enum ITEM_STATUS {
  PENDING = 1,
  PREPARING = 2,
  READY = 3,
  SERVED = 4,
  CANCELLED = 5
}

/** KOT document type */
export enum KOT_TYPE {
  REGULAR = 1, // new items added
  VOID = 2, // item cancellation signal to kitchen
  REPRINT = 3 // manual reprint requested
}

export enum KOT_GENERATION_MODE {
  AUTO = 1,
  MANUAL = 2
}

/** Payment methods supported */
export enum PAYMENT_METHOD {
  CASH = 1,
  CARD = 2,
  UPI = 3,
  WALLET = 4,
  ONLINE = 5
}

export enum SETTLEMENT_STATUS {
  UNSETTLED = 1,
  SETTLED = 2,
  SHORT_SETTLED = 3,
  OVER_SETTLED = 4,
  REFUNDED = 5,
  PARTIALLY_REFUNDED = 6
}

export enum SETTLEMENT_SOURCE {
  DIRECT_PAYMENT = 1,
  CUSTOMER_CREDIT = 2,
  SETTLEMENT_LEDGER = 3,
  WRITE_OFF = 4,
  REFUND_REVERSAL = 5
}

export enum ORDER_GROUP_TYPE {
  KOT = 1,
  BATCH = 2
}
