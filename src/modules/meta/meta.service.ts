import { OUTLET_TYPES, CUISINE_TYPES } from '@shared/constants';

import type { ConstantsResponse } from './meta.types';

export const getConstants = (): ConstantsResponse => {
  return {
    outletTypes: OUTLET_TYPES,
    cuisineTypes: CUISINE_TYPES,
  };
};

export default getConstants;
