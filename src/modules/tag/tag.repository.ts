import { Types, type FilterQuery } from 'mongoose';

import { CustomerTagEntity } from '@modules/tag/tag.model';
import type {
  CustomerTag,
  CustomerTagListQuery,
  CreateCustomerTagDTO,
  UpdateCustomerTagDTO
} from '@modules/tag/tag.types';

const toObjectId = (value: string) => new Types.ObjectId(value);

export class TagRepository {
  private buildTenantFilter(brandId: string, outletId: string): FilterQuery<CustomerTag> {
    return {
      brandId: toObjectId(brandId),
      outletId: toObjectId(outletId)
    };
  }

  async create(brandId: string, outletId: string, payload: CreateCustomerTagDTO) {
    return CustomerTagEntity.create({
      ...payload,
      brandId: toObjectId(brandId),
      outletId: toObjectId(outletId)
    });
  }

  async findById(brandId: string, outletId: string, id: string) {
    return CustomerTagEntity.findOne({
      ...this.buildTenantFilter(brandId, outletId),
      _id: toObjectId(id)
    })
      .collation({ locale: 'en', strength: 2 })
      .lean();
  }

  async findByName(brandId: string, outletId: string, name: string, excludeId?: string) {
    const query: FilterQuery<CustomerTag> = {
      ...this.buildTenantFilter(brandId, outletId),
      name: name.trim(),
      isActive: true
    };

    if (excludeId) {
      query._id = { $ne: toObjectId(excludeId) } as any;
    }

    return CustomerTagEntity.findOne(query).collation({ locale: 'en', strength: 2 }).lean();
  }

  async findByPriority(brandId: string, outletId: string, priority: number, excludeId?: string) {
    const query: FilterQuery<CustomerTag> = {
      ...this.buildTenantFilter(brandId, outletId),
      priority,
      isActive: true
    };

    if (excludeId) {
      query._id = { $ne: toObjectId(excludeId) } as any;
    }

    return CustomerTagEntity.findOne(query).lean();
  }

  async updateById(brandId: string, outletId: string, id: string, payload: UpdateCustomerTagDTO) {
    return CustomerTagEntity.findOneAndUpdate(
      {
        ...this.buildTenantFilter(brandId, outletId),
        _id: toObjectId(id)
      },
      { $set: payload },
      { new: true, runValidators: true }
    ).lean();
  }

  async softDeleteById(brandId: string, outletId: string, id: string) {
    return CustomerTagEntity.findOneAndUpdate(
      {
        ...this.buildTenantFilter(brandId, outletId),
        _id: toObjectId(id)
      },
      { $set: { isActive: false } },
      { new: true }
    ).lean();
  }

  async list(brandId: string, outletId: string, query: CustomerTagListQuery & { searchText?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter: FilterQuery<CustomerTag> = this.buildTenantFilter(brandId, outletId);

    const searchValue = query.searchText ?? query.search;
    if (searchValue) {
      filter.name = { $regex: new RegExp(searchValue.trim(), 'i') };
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const sortColumn = query.column || 'createdAt';
    const sortOrder = query.order === 'ASC' ? 1 : -1;

    const [items, total] = await Promise.all([
      CustomerTagEntity.find(filter)
        .collation({ locale: 'en', strength: 2 })
        .sort({ [sortColumn]: sortOrder, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomerTagEntity.countDocuments(filter)
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit
      }
    };
  }

  async findActiveByIds(brandId: string, outletId: string, tagIds: string[]) {
    if (!tagIds.length) {
      return [];
    }

    return CustomerTagEntity.find({
      ...this.buildTenantFilter(brandId, outletId),
      _id: { $in: tagIds.map(id => toObjectId(id)) },
      isActive: true
    })
      .sort({ priority: -1, name: 1 })
      .lean();
  }

  async findActiveByCustomerTagIds(brandId: string, outletId: string, tagIds: Types.ObjectId[]) {
    if (!tagIds.length) {
      return [];
    }

    return CustomerTagEntity.find({
      ...this.buildTenantFilter(brandId, outletId),
      _id: { $in: tagIds },
      isActive: true
    })
      .sort({ priority: -1, name: 1 })
      .lean();
  }
}

export const tagRepository = new TagRepository();
