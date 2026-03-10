import type { ConstantsResponse } from '@modules/meta/meta.types';

import { OUTLET_TYPES, CUISINE_TYPES } from '@shared/constants';

export const getConstants = (): ConstantsResponse => {
  return {
    outletTypes: OUTLET_TYPES,
    cuisineTypes: CUISINE_TYPES
  };
};

export default getConstants;
