import type { ORDER_TYPE } from '@shared/enum/order.enum';

import type { AppliedTaxSnapshot, OrderTaxBreakup } from '@modules/order/order.types';
import type { OrderType, TaxCalculationMethod, TaxType } from '@modules/tax/tax.types';

export interface TaxEngineTaxInput {
  taxId?: string | null;
  name: string;
  rate: number;
  type: TaxType;
  isInclusive: boolean;
  calculationMethod: TaxCalculationMethod;
  applicableOrderTypes?: OrderType[];
}

export interface DiscountAllocationInput {
  lineAmounts: number[];
  totalDiscount: number;
}

export interface TaxableLineInput {
  orderType: ORDER_TYPE;
  quantity: number;
  baseAmount: number;
  addonAmount?: number;
  discountAmount?: number;
  taxes?: TaxEngineTaxInput[];
}

export interface TaxableLineResult {
  quantity: number;
  baseLineAmount: number;
  addonTotal: number;
  grossLineAmount: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  netLineAmount: number;
  appliedTaxes: AppliedTaxSnapshot[];
}

export interface OrderTaxSummaryInput {
  lines: TaxableLineResult[];
}

export interface OrderTaxSummaryResult {
  grossAmount: number;
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  taxAmount: number; // This will represent the "Added" (Exclusive) tax for UI consistency
  inclusiveTaxAmount: number;
  exclusiveTaxAmount: number;
  totalTaxAmount: number;
  roundOffAmount: number;
  totalAmount: number;
  taxBreakup: OrderTaxBreakup[];
}
