import { tagRepository } from '@modules/tag/tag.repository';
import {
  CUSTOMER_TAG_DISCOUNT_TYPE,
  type CreateCustomerTagDTO,
  type CustomerTagListQuery,
  type UpdateCustomerTagDTO
} from '@modules/tag/tag.types';

export class TagService {
  private normalizeTagName(name: string) {
    return name.trim().replace(/\s+/g, ' ');
  }

  private validateDiscountPayload(payload: Partial<CreateCustomerTagDTO>) {
    const discountType = payload.discountType;
    const discountValue = payload.discountValue ?? 0;

    if (discountType === CUSTOMER_TAG_DISCOUNT_TYPE.NONE && discountValue !== 0) {
      throw { status: 400, message: 'discountValue must be 0 when discountType is NONE' };
    }

    if (
      discountType === CUSTOMER_TAG_DISCOUNT_TYPE.PERCENTAGE &&
      (discountValue <= 0 || discountValue > 100)
    ) {
      throw {
        status: 400,
        message: 'discountValue must be between 0.01 and 100 for percentage discounts'
      };
    }

    if (discountType === CUSTOMER_TAG_DISCOUNT_TYPE.FLAT && discountValue <= 0) {
      throw {
        status: 400,
        message: 'discountValue must be greater than 0 for flat discounts'
      };
    }
  }

  private async ensureNameAvailable(
    brandId: string,
    outletId: string,
    name: string | undefined,
    excludeId?: string
  ) {
    if (!name) {
      return;
    }

    const existing = await tagRepository.findByName(brandId, outletId, name, excludeId);
    if (existing) {
      throw { status: 409, message: 'Tag name already exists in this outlet' };
    }
  }

  private async ensurePriorityAvailable(
    brandId: string,
    outletId: string,
    priority: number | undefined,
    excludeId?: string
  ) {
    if (priority === undefined) {
      return;
    }

    const existing = await tagRepository.findByPriority(brandId, outletId, priority, excludeId);
    if (existing) {
      throw { status: 409, message: 'Tag priority already exists in this outlet' };
    }
  }

  async createTag(brandId: string, outletId: string, payload: CreateCustomerTagDTO) {
    const normalizedName = this.normalizeTagName(payload.name);
    this.validateDiscountPayload(payload);
    await Promise.all([
      this.ensureNameAvailable(brandId, outletId, normalizedName),
      this.ensurePriorityAvailable(brandId, outletId, payload.priority)
    ]);

    return tagRepository.create(brandId, outletId, {
      ...payload,
      name: normalizedName,
      discountValue:
        payload.discountType === CUSTOMER_TAG_DISCOUNT_TYPE.NONE ? 0 : payload.discountValue ?? 0,
      minOrderAmount: payload.minOrderAmount ?? 0,
      priority: payload.priority ?? 1,
      isActive: payload.isActive ?? true
    });
  }

  async updateTag(
    brandId: string,
    outletId: string,
    id: string,
    payload: UpdateCustomerTagDTO
  ) {
    const existing = await tagRepository.findById(brandId, outletId, id);
    if (!existing) {
      throw { status: 404, message: 'Tag not found' };
    }

    const normalizedName = payload.name ? this.normalizeTagName(payload.name) : undefined;
    const mergedPayload = {
      ...existing,
      ...payload,
      name: normalizedName ?? existing.name
    };

    this.validateDiscountPayload(mergedPayload);
    await Promise.all([
      this.ensureNameAvailable(brandId, outletId, normalizedName, id),
      this.ensurePriorityAvailable(brandId, outletId, payload.priority, id)
    ]);

    const updated = await tagRepository.updateById(brandId, outletId, id, {
      ...payload,
      name: normalizedName,
      discountValue:
        mergedPayload.discountType === CUSTOMER_TAG_DISCOUNT_TYPE.NONE
          ? 0
          : mergedPayload.discountValue
    });

    if (!updated) {
      throw { status: 404, message: 'Tag not found' };
    }

    return updated;
  }

  async getTags(brandId: string, outletId: string, query: CustomerTagListQuery) {
    return tagRepository.list(brandId, outletId, query);
  }

  async getTagById(brandId: string, outletId: string, id: string) {
    const tag = await tagRepository.findById(brandId, outletId, id);
    if (!tag) {
      throw { status: 404, message: 'Tag not found' };
    }

    return tag;
  }

  async deleteTag(brandId: string, outletId: string, id: string) {
    const tag = await tagRepository.softDeleteById(brandId, outletId, id);
    if (!tag) {
      throw { status: 404, message: 'Tag not found' };
    }

    return tag;
  }
}

export const tagService = new TagService();
