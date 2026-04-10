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
  private buildTenantFilter(brandId: string): FilterQuery<Customer> {
    return {
      brandId: toObjectId(brandId)
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
      ...this.buildTenantFilter(brandId),
      _id: toObjectId(id),
      isDelete: false
    })
      .populate('tags')
      .select('-isDelete')
      .lean();
  }

  async findRawById(brandId: string, outletId: string, id: string) {
    return CustomerEntity.findOne({
      ...this.buildTenantFilter(brandId),
      _id: toObjectId(id),
      isDelete: false
    })
      .select('-isDelete')
      .lean();
  }

  async findByMobile(brandId: string, mobile: string, excludeId?: string) {
    const query: FilterQuery<Customer> = {
      brandId: toObjectId(brandId),
      mobile: mobile.trim(),
      isDelete: false
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
        ...this.buildTenantFilter(brandId),
        _id: toObjectId(id),
        isDelete: false
      },
      { $set: updatePayload },
      { new: true, runValidators: true, projection: { isDelete: 0 } }
    )
      .populate('tags')
      .lean();
  }

  async list(brandId: string, outletId: string, query: CustomerListQuery & { searchText?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;
    const filter: FilterQuery<Customer> = this.buildTenantFilter(brandId);

    const searchValue = query.searchText;
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

    filter.isDelete = false;

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
        .select('-isDelete')
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
        ...this.buildTenantFilter(brandId),
        _id: toObjectId(id),
        isDelete: false
      },
      { $set: { isDelete: true } },
      { new: true, projection: { isDelete: 0 } }
    )
      .populate('tags')
      .lean();
  }

  async assignTags(brandId: string, outletId: string, id: string, payload: AssignCustomerTagsDTO) {
    return CustomerEntity.findOneAndUpdate(
      {
        ...this.buildTenantFilter(brandId),
        _id: toObjectId(id),
        isDelete: false
      },
      {
        $addToSet: {
          tags: { $each: payload.tagIds.map(tagId => toObjectId(tagId)) }
        }
      },
      { new: true, projection: { isDelete: 0 } }
    )
      .populate('tags')
      .lean();
  }

  async removeTag(brandId: string, outletId: string, id: string, tagId: string) {
    return CustomerEntity.findOneAndUpdate(
      {
        ...this.buildTenantFilter(brandId),
        _id: toObjectId(id),
        isDelete: false
      },
      {
        $pull: { tags: toObjectId(tagId) }
      },
      { new: true, projection: { isDelete: 0 } }
    )
      .populate('tags')
      .lean();
  }

  async updateStats(brandId: string, outletId: string, id: string, totalAmount: number) {
    const oId = toObjectId(outletId);
    const filter = {
      ...this.buildTenantFilter(brandId),
      _id: toObjectId(id),
      isDelete: false
    };

    // 1. Try to update existing outlet stats entry
    const updated = await CustomerEntity.findOneAndUpdate(
      { ...filter, 'outletStats.outletId': oId },
      {
        $inc: {
          totalSpent: totalAmount,
          totalOrders: 1,
          'outletStats.$.totalOrders': 1,
          'outletStats.$.totalSpent': totalAmount
        },
        $set: {
          lastVisitAt: new Date(),
          'outletStats.$.lastVisitAt': new Date()
        }
      },
      { new: true, projection: { isDelete: 0 } }
    ).lean();

    if (updated) {
      return updated;
    }

    // 2. If outlet entry doesn't exist, push a new one
    return CustomerEntity.findOneAndUpdate(
      filter,
      {
        $inc: {
          totalSpent: totalAmount,
          totalOrders: 1
        },
        $push: {
          outletStats: {
            outletId: oId,
            totalOrders: 1,
            totalSpent: totalAmount,
            lastVisitAt: new Date()
          }
        },
        $set: {
          lastVisitAt: new Date()
        }
      },
      { new: true, projection: { isDelete: 0 } }
    ).lean();
  }
}

export const customerRepository = new CustomerRepository();
