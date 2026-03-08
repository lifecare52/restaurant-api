import { GstScheme } from '@shared/enum';
import { Outlet } from '@modules/outlet/outlet.model';

/**
 * Checks if tax can be applied for the given outlet.
 * GST can only be collected if:
 * 1. gstEnabled is true
 * 2. gstNumber (gstNo) is provided
 * 3. gstScheme is REGULAR
 *
 * @param outlet The outlet object to check
 * @returns boolean indicating if tax can be applied
 */
export const canApplyTax = (outlet: Outlet): boolean => {
  if (!outlet.settings) return false;

  const { gstEnabled, gstNo, gstScheme } = outlet.settings;

  return !!(gstEnabled && gstNo && gstScheme === GstScheme.REGULAR);
};
