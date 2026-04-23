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
  private buildTenantFilter(brandId: string): FilterQuery<CustomerTag> {
    return {
      brandId: toObjectId(brandId)
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
      ...this.buildTenantFilter(brandId),
      _id: toObjectId(id),
      isDelete: false
    })
      .collation({ locale: 'en', strength: 2 })
      .select('-isDelete')
      .lean();
  }

  async findByName(brandId: string, outletId: string, name: string, excludeId?: string) {
    const query: FilterQuery<CustomerTag> = {
      ...this.buildTenantFilter(brandId),
      name: name.trim(),
      isDelete: false
    };

    if (excludeId) {
      query._id = { $ne: toObjectId(excludeId) } as any;
    }

    return CustomerTagEntity.findOne(query)
      .collation({ locale: 'en', strength: 2 })
      .select('-isDelete')
      .lean();
  }

  async findByPriority(brandId: string, outletId: string, priority: number, excludeId?: string) {
    const query: FilterQuery<CustomerTag> = {
      ...this.buildTenantFilter(brandId),
      priority,
      isDelete: false
    };

    if (excludeId) {
      query._id = { $ne: toObjectId(excludeId) } as any;
    }

    return CustomerTagEntity.findOne(query).select('-isDelete').lean();
  }

  async updateById(brandId: string, outletId: string, id: string, payload: UpdateCustomerTagDTO) {
    return CustomerTagEntity.findOneAndUpdate(
      {
        ...this.buildTenantFilter(brandId),
        _id: toObjectId(id),
        isDelete: false
      },
      { $set: payload },
      { new: true, runValidators: true, projection: { isDelete: 0 } }
    ).lean();
  }

  async softDeleteById(brandId: string, outletId: string, id: string) {
    return CustomerTagEntity.findOneAndUpdate(
      {
        ...this.buildTenantFilter(brandId),
        _id: toObjectId(id),
        isDelete: false
      },
      { $set: { isDelete: true } },
      { new: true }
    ).lean();
  }

  async list(brandId: string, outletId: string, query: CustomerTagListQuery & { searchText?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter: FilterQuery<CustomerTag> = this.buildTenantFilter(brandId);

    const searchValue = query.searchText ?? query.search;
    if (searchValue) {
      filter.name = { $regex: new RegExp(searchValue.trim(), 'i') };
    }

    filter.isDelete = false;

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
        .select('-isDelete')
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
      ...this.buildTenantFilter(brandId),
      _id: { $in: tagIds.map(id => toObjectId(id)) },
      isActive: true,
      isDelete: false
    })
      .sort({ priority: -1, name: 1 })
      .select('-isDelete')
      .lean();
  }

  async findActiveByCustomerTagIds(brandId: string, outletId: string, tagIds: any[]) {
    if (!tagIds || !tagIds.length) {
      return [];
    }

    // Handle any format: String, ObjectId, or Populated Object with _id/id
    const ids = tagIds
      .map(tag => {
        if (!tag) return null;
        if (typeof tag === 'string') return toObjectId(tag);
        if (tag instanceof Types.ObjectId) return tag;
        if (tag._id) return typeof tag._id === 'string' ? toObjectId(tag._id) : tag._id;
        if (tag.id) return typeof tag.id === 'string' ? toObjectId(tag.id) : tag.id;
        return null;
      })
      .filter(id => id !== null);

    if (!ids.length) return [];

    return CustomerTagEntity.find({
      brandId: toObjectId(brandId),
      _id: { $in: ids },
      isActive: true,
      isDelete: false
    })
      .sort({ priority: -1, name: 1 })
      .select('-isDelete')
      .lean();
  }
}

export const tagRepository = new TagRepository();
