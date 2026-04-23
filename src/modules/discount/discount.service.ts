import { Types } from 'mongoose';

import { customerRepository } from '@modules/customer/customer.repository';
import { CUSTOMER_TAG_DISCOUNT_TYPE, type CustomerTag } from '@modules/tag/tag.types';
import { tagRepository } from '@modules/tag/tag.repository';

export interface DiscountCalculationResult {
  discount: number;
  appliedTag: CustomerTag | null;
}

export class DiscountService {
  async calculateBestDiscount(
    customerId: string | null,
    orderAmount: number,
    brandId: string,
    outletId: string,
    manualTagId?: string | null
  ): Promise<DiscountCalculationResult> {
    let tagIds: any[] = [];

    if (customerId) {
      const customer = await customerRepository.findRawById(brandId, outletId, customerId);
      if (customer && customer.isActive) {
        tagIds = Array.isArray(customer.tags) ? [...customer.tags] : [];
      }
    }

    if (manualTagId) {
      tagIds.push(manualTagId);
    }

    if (!tagIds.length) {
      return { discount: 0, appliedTag: null };
    }

    const activeTags = await tagRepository.findActiveByCustomerTagIds(brandId, outletId, tagIds);

    return this.calculateDiscountFromTags(activeTags, orderAmount);
  }

  calculateDiscountFromTags(tags: CustomerTag[], orderAmount: number): DiscountCalculationResult {
    if (!tags.length || orderAmount <= 0) {
      return { discount: 0, appliedTag: null };
    }

    const applicableTags = tags
      .filter(tag => tag.isActive && orderAmount >= (tag.minOrderAmount ?? 0));

    const applicableTag = applicableTags
        .sort((a, b) => {
          if (b.priority !== a.priority) {
            return b.priority - a.priority;
          }

          return a.name.localeCompare(b.name);
        })[0] ?? null;

    if (!applicableTag || applicableTag.discountType === CUSTOMER_TAG_DISCOUNT_TYPE.NONE) {
      return { discount: 0, appliedTag: applicableTag };
    }

    if (applicableTag.discountType === CUSTOMER_TAG_DISCOUNT_TYPE.PERCENTAGE) {
      const discount = Number(((orderAmount * applicableTag.discountValue) / 100).toFixed(2));
      return {
        discount: Math.min(orderAmount, discount),
        appliedTag: applicableTag
      };
    }

    return {
      discount: Math.min(orderAmount, applicableTag.discountValue),
      appliedTag: applicableTag
    };
  }
}

export const discountService = new DiscountService();
