import { customerRepository } from '@modules/customer/customer.repository';
import type {
  AssignCustomerTagsDTO,
  CreateCustomerDTO,
  CustomerListQuery,
  UpdateCustomerDTO
} from '@modules/customer/customer.types';
import { tagRepository } from '@modules/tag/tag.repository';

export class CustomerService {
  private normalizeMobile(mobile: string) {
    const digitsOnly = mobile.replace(/\D/g, '');
    return digitsOnly.length === 12 && digitsOnly.startsWith('91') ? digitsOnly.slice(2) : digitsOnly;
  }

  private normalizeEmail(email?: string | null) {
    if (!email) {
      return null;
    }

    const normalized = email.trim().toLowerCase();
    return normalized || null;
  }

  private async ensureMobileAvailable(brandId: string, mobile: string, excludeId?: string) {
    const existing = await customerRepository.findByMobile(brandId, mobile, excludeId);
    if (existing) {
      throw { status: 409, message: 'Customer mobile already exists in this brand' };
    }
  }

  private async ensureTagsBelongToTenant(brandId: string, outletId: string, tagIds?: string[]) {
    if (!tagIds || !tagIds.length) {
      return;
    }

    const tags = await tagRepository.findActiveByIds(brandId, outletId, tagIds);
    if (tags.length !== new Set(tagIds).size) {
      throw { status: 404, message: 'One or more tags were not found in this outlet' };
    }
  }

  async createCustomer(brandId: string, outletId: string, payload: CreateCustomerDTO) {
    const normalizedMobile = this.normalizeMobile(payload.mobile);
    await Promise.all([
      this.ensureMobileAvailable(brandId, normalizedMobile),
      this.ensureTagsBelongToTenant(brandId, outletId, payload.tags)
    ]);

    return customerRepository.create(brandId, outletId, {
      ...payload,
      mobile: normalizedMobile,
      email: this.normalizeEmail(payload.email),
      tags: payload.tags ?? [],
      loyaltyPoints: payload.loyaltyPoints ?? 0,
      creditBalance: payload.creditBalance ?? 0,
      isActive: payload.isActive ?? true
    });
  }

  async updateCustomer(
    brandId: string,
    outletId: string,
    id: string,
    payload: UpdateCustomerDTO
  ) {
    const existing = await customerRepository.findRawById(brandId, outletId, id);
    if (!existing) {
      throw { status: 404, message: 'Customer not found' };
    }

    const normalizedMobile = payload.mobile ? this.normalizeMobile(payload.mobile) : undefined;
    await Promise.all([
      normalizedMobile ? this.ensureMobileAvailable(brandId, normalizedMobile, id) : Promise.resolve(),
      this.ensureTagsBelongToTenant(brandId, outletId, payload.tags)
    ]);

    const updated = await customerRepository.updateById(brandId, outletId, id, {
      ...payload,
      mobile: normalizedMobile,
      email: payload.email !== undefined ? this.normalizeEmail(payload.email) : undefined
    });

    if (!updated) {
      throw { status: 404, message: 'Customer not found' };
    }

    return updated;
  }

  async getCustomers(brandId: string, outletId: string, query: CustomerListQuery) {
    return customerRepository.list(brandId, outletId, query);
  }

  async getCustomerById(brandId: string, outletId: string, id: string) {
    const customer = await customerRepository.findById(brandId, outletId, id);
    if (!customer) {
      throw { status: 404, message: 'Customer not found' };
    }

    return customer;
  }

  async deleteCustomer(brandId: string, outletId: string, id: string) {
    const customer = await customerRepository.softDeleteById(brandId, outletId, id);
    if (!customer) {
      throw { status: 404, message: 'Customer not found' };
    }

    return customer;
  }

  async assignTags(
    brandId: string,
    outletId: string,
    id: string,
    payload: AssignCustomerTagsDTO
  ) {
    await this.ensureTagsBelongToTenant(brandId, outletId, payload.tagIds);
    const customer = await customerRepository.assignTags(brandId, outletId, id, payload);

    if (!customer) {
      throw { status: 404, message: 'Customer not found' };
    }

    return customer;
  }

  async removeTag(brandId: string, outletId: string, id: string, tagId: string) {
    const customer = await customerRepository.removeTag(brandId, outletId, id, tagId);
    if (!customer) {
      throw { status: 404, message: 'Customer not found' };
    }

    return customer;
  }

  async validateCustomerForOrder(brandId: string, outletId: string, customerId: string) {
    const customer = await customerRepository.findRawById(brandId, outletId, customerId);
    if (!customer || !customer.isActive || customer.isDelete) {
      throw { status: 404, message: 'Customer not found' };
    }

    return customer;
  }

  async updateCustomerStats(brandId: string, outletId: string, customerId: string, totalAmount: number) {
    await customerRepository.updateStats(brandId, outletId, customerId, totalAmount);
  }
}

export const customerService = new CustomerService();
