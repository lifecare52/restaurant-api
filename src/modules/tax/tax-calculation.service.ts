import { ORDER_TYPE } from '@shared/enum/order.enum';

import type { AppliedTaxSnapshot, OrderTaxBreakup } from '@modules/order/order.types';
import {
  ORDER_TYPES,
  TAX_CALCULATION_METHODS,
  TAX_TYPES,
  type OrderType
} from '@modules/tax/tax.types';
import type {
  DiscountAllocationInput,
  OrderTaxSummaryInput,
  OrderTaxSummaryResult,
  TaxEngineTaxInput,
  TaxableLineInput,
  TaxableLineResult
} from '@modules/tax/tax-calculation.types';

const CURRENCY_PRECISION = 2;

const roundCurrency = (value: number) => {
  const factor = 10 ** CURRENCY_PRECISION;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const mapOrderTypeToTaxOrderType = (orderType: ORDER_TYPE): OrderType => {
  switch (orderType) {
    case ORDER_TYPE.DINE_IN:
      return ORDER_TYPES.DINE_IN;
    case ORDER_TYPE.TAKEAWAY:
      return ORDER_TYPES.TAKE_AWAY;
    case ORDER_TYPE.DELIVERY:
      return ORDER_TYPES.ONLINE;
    default:
      return ORDER_TYPES.DINE_IN;
  }
};

const isTaxApplicable = (tax: TaxEngineTaxInput, orderType: OrderType) => {
  if (!tax.applicableOrderTypes || tax.applicableOrderTypes.length === 0) {
    return true;
  }

  return tax.applicableOrderTypes.includes(orderType);
};

const buildTaxSnapshot = (
  tax: TaxEngineTaxInput,
  taxableAmount: number,
  taxAmount: number
): AppliedTaxSnapshot => ({
  taxId: tax.taxId ? (tax.taxId as never) : null,
  name: tax.name,
  rate: tax.rate,
  type: tax.type,
  isInclusive: tax.isInclusive,
  calculationMethod: tax.calculationMethod,
  taxableAmount: roundCurrency(taxableAmount),
  taxAmount: roundCurrency(taxAmount)
});

const extractInclusiveBase = (grossAmount: number, taxes: TaxEngineTaxInput[]) => {
  if (taxes.some(tax => tax.type === TAX_TYPES.FLAT_AMOUNT)) {
    throw new Error('Flat inclusive taxes are not supported in V1');
  }

  let runningFactor = 1;

  for (const tax of taxes) {
    const rateFactor = tax.rate / 100;

    if (tax.calculationMethod === TAX_CALCULATION_METHODS.STANDARD) {
      runningFactor += rateFactor;
    } else {
      runningFactor += runningFactor * rateFactor;
    }
  }

  const baseAmount = runningFactor > 0 ? grossAmount / runningFactor : grossAmount;
  let runningAmount = baseAmount;
  const appliedTaxes: AppliedTaxSnapshot[] = [];

  for (const tax of taxes) {
    const taxableAmount =
      tax.calculationMethod === TAX_CALCULATION_METHODS.CUMULATIVE ? runningAmount : baseAmount;
    const taxAmount = taxableAmount * (tax.rate / 100);

    appliedTaxes.push(buildTaxSnapshot(tax, taxableAmount, taxAmount));
    runningAmount += taxAmount;
  }

  return {
    baseAmount: roundCurrency(baseAmount),
    appliedTaxes
  };
};

const calculateExclusiveTaxes = (baseAmount: number, taxes: TaxEngineTaxInput[]) => {
  let runningAmount = baseAmount;
  const appliedTaxes: AppliedTaxSnapshot[] = [];

  for (const tax of taxes) {
    const taxableAmount =
      tax.calculationMethod === TAX_CALCULATION_METHODS.CUMULATIVE ? runningAmount : baseAmount;

    let taxAmount = 0;

    if (tax.type === TAX_TYPES.PERCENTAGE) {
      taxAmount = taxableAmount * (tax.rate / 100);
    } else {
      taxAmount = tax.rate;
    }

    appliedTaxes.push(buildTaxSnapshot(tax, taxableAmount, taxAmount));
    runningAmount += taxAmount;
  }

  return {
    taxAmount: roundCurrency(appliedTaxes.reduce((sum, tax) => sum + tax.taxAmount, 0)),
    appliedTaxes
  };
};

export const allocateDiscountAcrossLines = ({
  lineAmounts,
  totalDiscount
}: DiscountAllocationInput) => {
  const safeTotalDiscount = roundCurrency(Math.max(0, totalDiscount));
  const totalBase = roundCurrency(lineAmounts.reduce((sum, amount) => sum + Math.max(0, amount), 0));

  if (safeTotalDiscount === 0 || totalBase === 0) {
    return lineAmounts.map(() => 0);
  }

  let allocated = 0;

  return lineAmounts.map((amount, index) => {
    if (index === lineAmounts.length - 1) {
      return roundCurrency(safeTotalDiscount - allocated);
    }

    const share = roundCurrency((Math.max(0, amount) / totalBase) * safeTotalDiscount);
    allocated += share;
    return share;
  });
};

export const calculateLineTax = (input: TaxableLineInput): TaxableLineResult => {
  const addonTotal = roundCurrency(Math.max(0, input.addonAmount ?? 0));
  const baseLineAmount = roundCurrency(Math.max(0, input.baseAmount) * Math.max(1, input.quantity));
  const grossLineAmount = roundCurrency(baseLineAmount + addonTotal);
  const discountAmount = roundCurrency(
    clamp(input.discountAmount ?? 0, 0, grossLineAmount)
  );
  const discountedGrossAmount = roundCurrency(grossLineAmount - discountAmount);
  const taxOrderType = mapOrderTypeToTaxOrderType(input.orderType);

  const applicableTaxes = (input.taxes ?? []).filter(tax => isTaxApplicable(tax, taxOrderType));
  const inclusiveTaxes = applicableTaxes.filter(tax => tax.isInclusive);
  const exclusiveTaxes = applicableTaxes.filter(tax => !tax.isInclusive);


  const inclusiveResult =
    inclusiveTaxes.length > 0
      ? extractInclusiveBase(discountedGrossAmount, inclusiveTaxes)
      : { baseAmount: discountedGrossAmount, appliedTaxes: [] as AppliedTaxSnapshot[] };

  const exclusiveResult = calculateExclusiveTaxes(inclusiveResult.baseAmount, exclusiveTaxes);
  const appliedTaxes = [...inclusiveResult.appliedTaxes, ...exclusiveResult.appliedTaxes];
  const totalTaxAmount = roundCurrency(
    appliedTaxes.reduce((sum, tax) => sum + tax.taxAmount, 0)
  );
  const netLineAmount = roundCurrency(discountedGrossAmount + exclusiveResult.taxAmount);


  return {
    quantity: input.quantity,
    baseLineAmount,
    addonTotal,
    grossLineAmount,
    discountAmount,
    taxableAmount: inclusiveResult.baseAmount,
    taxAmount: totalTaxAmount,
    netLineAmount,
    appliedTaxes
  };
};

export const summarizeOrderTaxes = ({
  lines
}: OrderTaxSummaryInput): OrderTaxSummaryResult => {
  const taxBreakupMap = new Map<string, OrderTaxBreakup>();

  for (const line of lines) {
    for (const tax of line.appliedTaxes) {
      const key = [
        tax.taxId ?? 'null',
        tax.name,
        tax.rate,
        tax.type,
        tax.isInclusive,
        tax.calculationMethod
      ].join('|');

      const existing = taxBreakupMap.get(key);

      if (existing) {
        existing.taxableAmount = roundCurrency(existing.taxableAmount + tax.taxableAmount);
        existing.taxAmount = roundCurrency(existing.taxAmount + tax.taxAmount);
      } else {
        taxBreakupMap.set(key, { ...tax });
      }
    }
  }

  const grossAmount = roundCurrency(lines.reduce((sum, line) => sum + line.grossLineAmount, 0));
  const totalDiscount = roundCurrency(lines.reduce((sum, line) => sum + line.discountAmount, 0));
  const subtotal = roundCurrency(grossAmount - totalDiscount);
  const taxableAmount = roundCurrency(lines.reduce((sum, line) => sum + line.taxableAmount, 0));
  const totalTaxAmount = roundCurrency(lines.reduce((sum, line) => sum + line.taxAmount, 0));
  const totalAmount = roundCurrency(lines.reduce((sum, line) => sum + line.netLineAmount, 0));

  const inclusiveTaxAmount = roundCurrency(
    Array.from(taxBreakupMap.values())
      .filter(t => t.isInclusive)
      .reduce((sum, t) => sum + t.taxAmount, 0)
  );
  const exclusiveTaxAmount = roundCurrency(
    Array.from(taxBreakupMap.values())
      .filter(t => !t.isInclusive)
      .reduce((sum, t) => sum + t.taxAmount, 0)
  );


  return {
    grossAmount,
    subtotal,
    totalDiscount,
    taxableAmount,
    taxAmount: exclusiveTaxAmount, // For UI: Subtotal + Tax = Total
    inclusiveTaxAmount,
    exclusiveTaxAmount,
    totalTaxAmount,
    roundOffAmount: 0,
    totalAmount,
    taxBreakup: Array.from(taxBreakupMap.values())
  };
};

export const taxCalculationService = {
  roundCurrency,
  allocateDiscountAcrossLines,
  calculateLineTax,
  summarizeOrderTaxes
};

export default taxCalculationService;
