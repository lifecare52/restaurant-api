import type { Types } from 'mongoose';

export interface TokenDisplayItem {
  tokenNo?: string | null;
  orderId: Types.ObjectId | string;
  orderNumber: string;
}

export interface TokenDisplayResponse {
  preparing: TokenDisplayItem[];
  ready: TokenDisplayItem[];
}
