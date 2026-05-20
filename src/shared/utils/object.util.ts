/**
 * Flattens a nested object into a single-level object with dotted notation keys.
 * This is extremely useful for MongoDB partial updates via $set, ensuring nested fields
 * do not overwrite their sibling fields in the database document.
 *
 * Example:
 * flattenObject({ settings: { paymentSettings: { isSplitPaymentEnabled: true } } })
 * Returns:
 * { 'settings.paymentSettings.isSplitPaymentEnabled': true }
 */
export const flattenObject = (obj: any, prefix = ''): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  const result: any = {};

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    
    // Ignore undefined properties to avoid overwriting database fields with undefined
    if (value === undefined) {
      continue;
    }

    const newKey = prefix ? `${prefix}.${key}` : key;

    // Check if the value is a plain object that should be flattened recursively.
    // We should NOT flatten:
    // - Arrays (e.g. allowedMethods)
    // - Dates
    // - MongoDB/BSON ObjectIds
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value._bsontype) &&
      !(value.constructor && value.constructor.name === 'ObjectId')
    ) {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
};
