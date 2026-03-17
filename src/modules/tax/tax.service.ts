import { Types } from 'mongoose';

import { TaxGroupEntity } from '@modules/tax/tax-group.model';
import { TaxEntity } from '@modules/tax/tax.model';
import type { Tax, TaxGroup } from '@modules/tax/tax.types';

import type { PaginationQuery } from '@shared/interfaces/pagination';

export class TaxService {
  // ==============================
  // individual tax methods
  // ==============================

  async createTax(brandId: string, outletId: string, payload: Partial<Tax>): Promise<Tax> {
    const existingTax = await TaxEntity.findOne({
      brandId,
      outletId,
      name: payload.name,
      isDelete: false
    });

    if (existingTax) {
      throw { status: 409, message: 'A tax with this name already exists in this outlet' };
    }

    const newTax = new TaxEntity({
      ...payload,
      brandId,
      outletId
    });

    return await newTax.save();
  }

  async getTaxes(brandId: string, outletId: string, data: PaginationQuery & { isActive?: string }) {
    const { page = 1, limit = 10, isActive } = data;
    const skip = (page - 1) * limit;

    const query: any = { brandId, outletId, isDelete: false };
    if (isActive !== undefined) {
      query.isActive = typeof isActive === 'string' ? isActive === 'true' : !!isActive;
    }

    const sortColumn = data.column || 'name';
    const sortOrder = data.order === 'DESC' ? -1 : 1;

    const [taxes, total] = await Promise.all([
      TaxEntity.find(query)
        .sort({ [sortColumn]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      TaxEntity.countDocuments(query)
    ]);

    return {
      data: taxes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getTaxById(brandId: string, outletId: string, taxId: string): Promise<Tax> {
    const tax = await TaxEntity.findOne({
      _id: taxId,
      brandId,
      outletId,
      isDelete: false
    }).lean();

    if (!tax) {
      throw { status: 404, message: 'Tax not found' };
    }

    return tax as unknown as Tax;
  }

  async updateTax(
    brandId: string,
    outletId: string,
    taxId: string,
    payload: Partial<Tax>
  ): Promise<Tax> {
    if (payload.name) {
      const existingTax = await TaxEntity.findOne({
        _id: { $ne: taxId },
        brandId,
        outletId,
        name: payload.name,
        isDelete: false
      });

      if (existingTax) {
        throw { status: 409, message: 'A tax with this name already exists in this outlet' };
      }
    }

    const updatedTax = await TaxEntity.findOneAndUpdate(
      { _id: taxId, brandId, outletId, isDelete: false },
      { $set: payload },
      { new: true, runValidators: true }
    );

    if (!updatedTax) {
      throw { status: 404, message: 'Tax not found' };
    }

    return updatedTax as unknown as Tax;
  }

  async deleteTax(brandId: string, outletId: string, taxId: string) {
    const deletedTax = await TaxEntity.findOneAndUpdate(
      { _id: taxId, brandId, outletId, isDelete: false },
      { $set: { isDelete: true, isActive: false } },
      { new: true }
    );

    if (!deletedTax) {
      throw { status: 404, message: 'Tax not found' };
    }

    // Optional: when a tax is deleted, we might want to remove it from all tax groups.
    await TaxGroupEntity.updateMany(
      { brandId, outletId, taxes: taxId },
      { $pull: { taxes: taxId } }
    );

    return true;
  }

  async listActiveTaxes(brandId: string, outletId: string): Promise<Tax[]> {
    return (await TaxEntity.find({
      brandId,
      outletId,
      isActive: true,
      isDelete: false
    }).lean()) as unknown as Tax[];
  }

  // ==============================
  // tax group methods
  // ==============================

  async createTaxGroup(
    brandId: string,
    outletId: string,
    payload: Partial<TaxGroup>
  ): Promise<TaxGroup> {
    const existingGroup = await TaxGroupEntity.findOne({
      brandId,
      outletId,
      name: payload.name,
      isDelete: false
    });

    if (existingGroup) {
      throw { status: 409, message: 'A tax group with this name already exists in this outlet' };
    }

    // Verify all taxes exist
    if (payload.taxes && payload.taxes.length > 0) {
      const activeTaxes = await TaxEntity.countDocuments({
        _id: { $in: payload.taxes },
        brandId,
        outletId,
        isDelete: false
      });

      if (activeTaxes !== payload.taxes.length) {
        throw { status: 404, message: 'One or more selected taxes were not found or are deleted' };
      }
    }

    const newGroup = new TaxGroupEntity({
      ...payload,
      brandId,
      outletId
    });

    return await newGroup.save();
  }

  async getTaxGroups(
    brandId: string,
    outletId: string,
    data: PaginationQuery & { isActive?: string }
  ) {
    const { page = 1, limit = 10, isActive } = data;
    const skip = (page - 1) * limit;

    const query: any = { brandId, outletId, isDelete: false };
    if (isActive !== undefined) {
      query.isActive = typeof isActive === 'string' ? isActive === 'true' : !!isActive;
    }

    const sortColumn = data.column || 'name';
    const sortOrder = data.order === 'DESC' ? -1 : 1;

    const [groups, total] = await Promise.all([
      TaxGroupEntity.find(query)
        .populate('taxes')
        .sort({ [sortColumn]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      TaxGroupEntity.countDocuments(query)
    ]);

    return {
      data: groups,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getTaxGroupById(brandId: string, outletId: string, groupId: string): Promise<TaxGroup> {
    const group = await TaxGroupEntity.findOne({
      _id: groupId,
      brandId,
      outletId,
      isDelete: false
    })
      .populate('taxes')
      .lean();

    if (!group) {
      throw { status: 404, message: 'Tax group not found' };
    }

    return group as unknown as TaxGroup;
  }

  async updateTaxGroup(
    brandId: string,
    outletId: string,
    groupId: string,
    payload: Partial<TaxGroup>
  ): Promise<TaxGroup> {
    if (payload.name) {
      const existingGroup = await TaxGroupEntity.findOne({
        _id: { $ne: groupId },
        brandId,
        outletId,
        name: payload.name,
        isDelete: false
      });

      if (existingGroup) {
        throw { status: 409, message: 'A tax group with this name already exists in this outlet' };
      }
    }

    if (payload.taxes && payload.taxes.length > 0) {
      const activeTaxes = await TaxEntity.countDocuments({
        _id: { $in: payload.taxes },
        brandId,
        outletId,
        isDelete: false
      });

      if (activeTaxes !== payload.taxes.length) {
        throw { status: 404, message: 'One or more selected taxes were not found or are deleted' };
      }
    }

    const updatedGroup = await TaxGroupEntity.findOneAndUpdate(
      { _id: groupId, brandId, outletId, isDelete: false },
      { $set: payload },
      { new: true, runValidators: true }
    ).populate('taxes');

    if (!updatedGroup) {
      throw { status: 404, message: 'Tax group not found' };
    }

    return updatedGroup as unknown as TaxGroup;
  }

  async deleteTaxGroup(brandId: string, outletId: string, groupId: string) {
    const deletedGroup = await TaxGroupEntity.findOneAndUpdate(
      { _id: groupId, brandId, outletId, isDelete: false },
      { $set: { isDelete: true, isActive: false } },
      { new: true }
    );

    if (!deletedGroup) {
      throw { status: 404, message: 'Tax group not found' };
    }

    return true;
  }

  async listActiveTaxGroups(brandId: string, outletId: string): Promise<TaxGroup[]> {
    return (await TaxGroupEntity.find({
      brandId,
      outletId,
      isActive: true,
      isDelete: false
    })
      .populate('taxes')
      .lean()) as unknown as TaxGroup[];
  }
}

export const taxService = new TaxService();
