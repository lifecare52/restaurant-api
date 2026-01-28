import type { OUTLET_TYPES, CUISINE_TYPES } from '@shared/constants';

export type OutletType = (typeof OUTLET_TYPES)[number];
export type CuisineType = (typeof CUISINE_TYPES)[number];

export interface ConstantsResponse {
  outletTypes: readonly OutletType[];
  cuisineTypes: readonly CuisineType[];
}
