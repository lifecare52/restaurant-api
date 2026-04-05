import { Types, type FilterQuery, type UpdateQuery } from 'mongoose';

import { CustomerEntity } from '@modules/customer/customer.model';
import type {
  AssignCustomerTagsDTO,
  CreateCustomerDTO,
  Customer,
  CustomerListQuery,
  UpdateCustomerDTO
} from '@modules/customer/customer.types';

const toObjectId = (value: string) => new Types.ObjectId(value);

export class CustomerRepository {
  private buildTenantFilter(brandId: string, outletId: string): FilterQuery<Customer> {
    return {
      brandId: toObjectId(brandId),
      outletId: toObjectId(outletId)
    };
  }

  async create(brandId: string, outletId: string, payload: CreateCustomerDTO) {
    return CustomerEntity.create({
      ...payload,
      tags: (payload.tags ?? []).map(tagId => toObjectId(tagId)),
      brandId: toObjectId(brandId),
      outletId: toObjectId(outletId)
    });
  }

  async findById(brandId: string, outletId: string, id: string) {
    return CustomerEntity.findOne({
      ...this.buildTenantFilter(brandId, outletId),
      _id: toObjectId(id)
    })
      .populate('tags')
      .lean();
  }

  async findRawById(brandId: string, outletId: string, id: string) {
    return CustomerEntity.findOne({
      ...this.buildTenantFilter(brandId, outletId),
      _id: toObjectId(id)
    }).lean();
  }

  async findByMobile(brandId: string, mobile: string, excludeId?: string) {
    const query: FilterQuery<Customer> = {
      brandId: toObjectId(brandId),
      mobile: mobile.trim(),
      isActive: true
    };

    if (excludeId) {
      query._id = { $ne: toObjectId(excludeId) } as any;
    }

    return CustomerEntity.findOne(query).lean();
  }

  async updateById(brandId: string, outletId: string, id: string, payload: UpdateCustomerDTO) {
    const updatePayload: UpdateQuery<Customer> = { ...payload };
    if (payload.tags) {
      updatePayload.tags = payload.tags.map(tagId => toObjectId(tagId)) as any;
    }

    return CustomerEntity.findOneAndUpdate(
      {
        ...this.buildTenantFilter(brandId, outletId),
        _id: toObjectId(id)
      },
      { $set: updatePayload },
      { new: true, runValidators: true }
    )
      .populate('tags')
      .lean();
  }

  async list(brandId: string, outletId: string, query: CustomerListQuery & { searchText?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter: FilterQuery<Customer> = this.buildTenantFilter(brandId, outletId);

    const searchValue = query.searchText ?? query.search;
    if (searchValue) {
      const trimmedSearch = searchValue.trim();
      const mobileSearch = trimmedSearch.replace(/[^\d+]/g, '');
      const searchConditions: FilterQuery<Customer>[] = [
        { name: { $regex: new RegExp(trimmedSearch, 'i') } }
      ];

      if (mobileSearch) {
        searchConditions.push({ mobile: { $regex: new RegExp(mobileSearch) } });
      }

      filter.$or = searchConditions;
    }

    if (query.tagId) {
      filter.tags = toObjectId(query.tagId);
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const sortColumn = query.column || 'createdAt';
    const sortOrder = query.order === 'ASC' ? 1 : -1;

    const [items, total] = await Promise.all([
      CustomerEntity.find(filter)
        .populate('tags')
        .sort({ [sortColumn]: sortOrder, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomerEntity.countDocuments(filter)
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

  async softDeleteById(brandId: string, outletId: string, id: string) {
    return CustomerEntity.findOneAndUpdate(
      {
        ...this.buildTenantFilter(brandId, outletId),
        _id: toObjectId(id)
      },
      { $set: { isActive: false } },
      { new: true }
    )
      .populate('tags')
      .lean();
  }

  async assignTags(brandId: string, outletId: string, id: string, payload: AssignCustomerTagsDTO) {
    return CustomerEntity.findOneAndUpdate(
      {
        ...this.buildTenantFilter(brandId, outletId),
        _id: toObjectId(id)
      },
      {
        $addToSet: {
          tags: { $each: payload.tagIds.map(tagId => toObjectId(tagId)) }
        }
      },
      { new: true }
    )
      .populate('tags')
      .lean();
  }

  async removeTag(brandId: string, outletId: string, id: string, tagId: string) {
    return CustomerEntity.findOneAndUpdate(
      {
        ...this.buildTenantFilter(brandId, outletId),
        _id: toObjectId(id)
      },
      {
        $pull: { tags: toObjectId(tagId) }
      },
      { new: true }
    )
      .populate('tags')
      .lean();
  }

  async updateStats(brandId: string, outletId: string, id: string, totalAmount: number) {
    return CustomerEntity.findOneAndUpdate(
      {
        ...this.buildTenantFilter(brandId, outletId),
        _id: toObjectId(id),
        isActive: true
      },
      {
        $inc: {
          totalSpent: totalAmount,
          totalOrders: 1
        },
        $set: {
          lastVisitAt: new Date()
        }
      },
      { new: true }
    ).lean();
  }
}

export const customerRepository = new CustomerRepository();
