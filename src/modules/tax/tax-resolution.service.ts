import { Types } from 'mongoose';

import CategoryEntity from '@modules/menu/category/category.model';
import type { TaxEngineTaxInput } from '@modules/tax/tax-calculation.types';
import { TaxGroupEntity } from '@modules/tax/tax-group.model';
import TaxEntity from '@modules/tax/tax.model';

export interface TaxResolutionMenuItemInput {
  _id: Types.ObjectId | string;
  categoryId: Types.ObjectId | string;
  taxGroupId?: Types.ObjectId | string | null;
}

export interface ResolvedMenuItemTaxData {
  taxGroupId: Types.ObjectId | null;
  taxes: TaxEngineTaxInput[];
}

export const resolveEffectiveTaxesForMenuItems = async (
  brandId: string,
  outletId: string,
  menuItems: TaxResolutionMenuItemInput[]
) => {
  const uniqueCategoryIds = [...new Set(menuItems.map(item => String(item.categoryId)))];

  const categories = uniqueCategoryIds.length
    ? await CategoryEntity.find({
        _id: { $in: uniqueCategoryIds.map(id => new Types.ObjectId(id)) },
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        isDelete: false
      })
        .select('_id taxGroupId')
        .lean()
    : [];

  const categoryTaxGroupMap = new Map(
    categories.map(category => [String(category._id), category.taxGroupId ?? null])
  );

  const effectiveTaxGroupIds = [
    ...new Set(
      menuItems
        .map(item => item.taxGroupId ?? categoryTaxGroupMap.get(String(item.categoryId)) ?? null)
        .filter(Boolean)
        .map(id => String(id))
    )
  ];

  const taxGroups = effectiveTaxGroupIds.length
    ? await TaxGroupEntity.find({
        _id: { $in: effectiveTaxGroupIds.map(id => new Types.ObjectId(id)) },
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        isDelete: false,
        isActive: true
      })
        .select('_id taxes')
        .lean()
    : [];

  const groupMap = new Map(taxGroups.map(group => [String(group._id), group]));
  const uniqueTaxIds = [...new Set(taxGroups.flatMap(group => (group.taxes ?? []).map(taxId => String(taxId))))];

  const taxes = uniqueTaxIds.length
    ? await TaxEntity.find({
        _id: { $in: uniqueTaxIds.map(id => new Types.ObjectId(id)) },
        brandId: new Types.ObjectId(brandId),
        outletId: new Types.ObjectId(outletId),
        isDelete: false,
        isActive: true
      })
        .select('_id name rate type isInclusive calculationMethod applicableOrderTypes')
        .lean()
    : [];

  const taxMap = new Map<string, TaxEngineTaxInput>(
    taxes.map(tax => [
      String(tax._id),
      {
        taxId: String(tax._id),
        name: tax.name,
        rate: tax.rate,
        type: tax.type,
        isInclusive: tax.isInclusive,
        calculationMethod: tax.calculationMethod,
        applicableOrderTypes: tax.applicableOrderTypes
      }
    ])
  );

  const resolvedMap = new Map<string, ResolvedMenuItemTaxData>();

  for (const item of menuItems) {
    const effectiveTaxGroupId =
      item.taxGroupId ?? categoryTaxGroupMap.get(String(item.categoryId)) ?? null;

    if (!effectiveTaxGroupId) {
      resolvedMap.set(String(item._id), { taxGroupId: null, taxes: [] });
      continue;
    }

    const taxGroup = groupMap.get(String(effectiveTaxGroupId));
    if (!taxGroup) {
      resolvedMap.set(String(item._id), { taxGroupId: null, taxes: [] });
      continue;
    }

    resolvedMap.set(String(item._id), {
      taxGroupId: new Types.ObjectId(String(effectiveTaxGroupId)),
      taxes: (taxGroup.taxes ?? []).reduce<TaxEngineTaxInput[]>((acc, taxId) => {
        const resolvedTax = taxMap.get(String(taxId));
        if (resolvedTax) {
          acc.push(resolvedTax);
        }
        return acc;
      }, [])
    });
  }

  return resolvedMap;
};

export default {
  resolveEffectiveTaxesForMenuItems
};
