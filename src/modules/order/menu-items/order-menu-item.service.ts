import { Types } from 'mongoose';

import MenuItemEntity from '@modules/menu/menu-items/menu-item.model';

/**
 * Returns the full POS menu grouped by category for a given brand/outlet.
 *
 * Aggregation covers:
 *  - Menu items (isActive=true, isDelete=false)
 *  - Category lookup
 *  - Variants + Variation master
 *  - Variant-level addons + Addon master (name, items)
 *  - Top-level addons (no variant) + Addon master
 *  - Measurement config nested object
 *
 * Response deliberately excludes: brandId, outletId, isDelete.
 */
export const getPosMenuCategoryWise = async (brandId: string, outletId: string) => {
    const brandObjectId = new Types.ObjectId(brandId);
    const outletObjectId = new Types.ObjectId(outletId);

    return MenuItemEntity.aggregate([
        /* ─── 1. MATCH active, non-deleted menu items ─── */
        {
            $match: {
                brandId: brandObjectId,
                outletId: outletObjectId,
                isActive: true,
                isDelete: false,
            },
        },

        /* ─── 2. CATEGORY ─── */
        {
            $lookup: {
                from: 'categories',
                localField: 'categoryId',
                foreignField: '_id',
                as: 'categoryDoc',
            },
        },
        { $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: false } },

        /* ─── 3. VARIANTS (active, non-deleted) ─── */
        {
            $lookup: {
                from: 'menu_item_variants',
                let: { menuItemId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$menuItemId', '$$menuItemId'] },
                            isActive: true,
                            isDelete: false,
                        },
                    },
                ],
                as: 'variants',
            },
        },

        /* ─── 4. VARIATION MASTER ─── */
        {
            $lookup: {
                from: 'variations',
                localField: 'variants.variationId',
                foreignField: '_id',
                as: 'variationDocs',
            },
        },

        /* ─── 5. VARIANT-LEVEL ADDONS (active, non-deleted) ─── */
        {
            $lookup: {
                from: 'menu_item_addons',
                let: { variantIds: '$variants._id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $in: ['$menuItemVariantId', '$$variantIds'] },
                            isActive: true,
                            isDelete: false,
                        },
                    },
                ],
                as: 'variantAddonLinks',
            },
        },

        /* ─── 6. ADDON MASTER for variant-level addons ─── */
        {
            $lookup: {
                from: 'addons',
                localField: 'variantAddonLinks.addonId',
                foreignField: '_id',
                as: 'variantAddonDocs',
            },
        },

        /* ─── 7. TOP-LEVEL ADDON LINKS (no variant, active, non-deleted) ─── */
        {
            $lookup: {
                from: 'menu_item_addons',
                let: { menuItemId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$menuItemId', '$$menuItemId'] },
                            menuItemVariantId: { $exists: false },
                            isActive: true,
                            isDelete: false,
                        },
                    },
                ],
                as: 'topAddonLinks',
            },
        },

        /* ─── 8. ADDON MASTER for top-level addons ─── */
        {
            $lookup: {
                from: 'addons',
                localField: 'topAddonLinks.addonId',
                foreignField: '_id',
                as: 'topAddonDocs',
            },
        },

        /* ─── 9. PROJECT full item shape ─── */
        {
            $addFields: {
                /* ----- dietaryShort ----- */
                dietaryShort: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$dietary', 'VEG'] }, then: 'V' },
                            { case: { $eq: ['$dietary', 'NON_VEG'] }, then: 'NV' },
                            { case: { $eq: ['$dietary', 'EGG'] }, then: 'E' },
                        ],
                        default: null,
                    },
                },

                /* ----- measurementConfig (nested) ----- */
                measurementConfig: {
                    $cond: [
                        { $eq: ['$isMeasurementBased', true] },
                        '$measurementConfig',
                        null,
                    ],
                },

                /* ----- VARIATIONS (with addons) ----- */
                variations: {
                    $map: {
                        input: '$variants',
                        as: 'v',
                        in: {
                            _id: '$$v._id',
                            variationId: '$$v.variationId',
                            variationName: {
                                $let: {
                                    vars: {
                                        vDoc: {
                                            $first: {
                                                $filter: {
                                                    input: '$variationDocs',
                                                    as: 'vd',
                                                    cond: { $eq: ['$$vd._id', '$$v.variationId'] },
                                                },
                                            },
                                        },
                                    },
                                    in: '$$vDoc.name',
                                },
                            },
                            basePrice: '$$v.basePrice',
                            costPrice: '$$v.costPrice',
                            isMeasurementBased: '$$v.isMeasurementBased',
                            measurementConfig: {
                                $cond: [
                                    { $eq: ['$$v.isMeasurementBased', true] },
                                    '$$v.measurementConfig',
                                    null,
                                ],
                            },
                            isDefault: '$$v.isDefault',
                            addons: {
                                $map: {
                                    input: {
                                        $filter: {
                                            input: '$variantAddonLinks',
                                            as: 'al',
                                            cond: { $eq: ['$$al.menuItemVariantId', '$$v._id'] },
                                        },
                                    },
                                    as: 'al',
                                    in: {
                                        addonId: '$$al.addonId',
                                        isSingleSelect: '$$al.isSingleSelect',
                                        min: '$$al.min',
                                        max: '$$al.max',
                                        name: {
                                            $let: {
                                                vars: {
                                                    adDoc: {
                                                        $first: {
                                                            $filter: {
                                                                input: '$variantAddonDocs',
                                                                as: 'ad',
                                                                cond: { $eq: ['$$ad._id', '$$al.addonId'] },
                                                            },
                                                        },
                                                    },
                                                },
                                                in: '$$adDoc.name',
                                            },
                                        },
                                        items: {
                                            $let: {
                                                vars: {
                                                    adDoc: {
                                                        $first: {
                                                            $filter: {
                                                                input: '$variantAddonDocs',
                                                                as: 'ad',
                                                                cond: { $eq: ['$$ad._id', '$$al.addonId'] },
                                                            },
                                                        },
                                                    },
                                                },
                                                in: {
                                                    $cond: [
                                                        {
                                                            $gt: [
                                                                { $size: { $ifNull: ['$$al.allowedItemIds', []] } },
                                                                0,
                                                            ],
                                                        },
                                                        /* only allowed items */
                                                        {
                                                            $filter: {
                                                                input: { $ifNull: ['$$adDoc.items', []] },
                                                                as: 'ai',
                                                                cond: { $in: ['$$ai._id', '$$al.allowedItemIds'] },
                                                            },
                                                        },
                                                        /* all items */
                                                        { $ifNull: ['$$adDoc.items', []] },
                                                    ],
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },

                /* ----- TOP-LEVEL ADDONS (non-variation items) ----- */
                addons: {
                    $map: {
                        input: '$topAddonLinks',
                        as: 'al',
                        in: {
                            addonId: '$$al.addonId',
                            isSingleSelect: '$$al.isSingleSelect',
                            min: '$$al.min',
                            max: '$$al.max',
                            name: {
                                $let: {
                                    vars: {
                                        adDoc: {
                                            $first: {
                                                $filter: {
                                                    input: '$topAddonDocs',
                                                    as: 'ad',
                                                    cond: { $eq: ['$$ad._id', '$$al.addonId'] },
                                                },
                                            },
                                        },
                                    },
                                    in: '$$adDoc.name',
                                },
                            },
                            items: {
                                $let: {
                                    vars: {
                                        adDoc: {
                                            $first: {
                                                $filter: {
                                                    input: '$topAddonDocs',
                                                    as: 'ad',
                                                    cond: { $eq: ['$$ad._id', '$$al.addonId'] },
                                                },
                                            },
                                        },
                                    },
                                    in: {
                                        $cond: [
                                            {
                                                $gt: [
                                                    { $size: { $ifNull: ['$$al.allowedItemIds', []] } },
                                                    0,
                                                ],
                                            },
                                            {
                                                $filter: {
                                                    input: { $ifNull: ['$$adDoc.items', []] },
                                                    as: 'ai',
                                                    cond: { $in: ['$$ai._id', '$$al.allowedItemIds'] },
                                                },
                                            },
                                            { $ifNull: ['$$adDoc.items', []] },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },

        /* ─── 10. SHAPE final item (strip internal fields) ─── */
        {
            $project: {
                /* category fields */
                categoryId: '$categoryDoc._id',
                category: '$categoryDoc.name',

                /* item fields — explicit whitelist (no brandId, outletId, isDelete) */
                _id: 1,
                name: 1,
                shortCodes: 1,
                dietary: 1,
                dietaryShort: 1,
                basePrice: 1,
                costPrice: 1,
                isVariation: 1,
                online: 1,
                takeAway: 1,
                dineIn: 1,
                isActive: 1,
                isMeasurementBased: 1,
                measurementConfig: 1,
                variations: 1,
                addons: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },

        /* ─── 11. GROUP by category ─── */
        {
            $group: {
                _id: '$categoryId',
                category: { $first: '$category' },
                items: { $push: '$$ROOT' },
            },
        },

        /* ─── 12. CLEAN UP grouped items (remove redundant categoryId/category per-item) ─── */
        {
            $project: {
                _id: 0,
                categoryId: '$_id',
                category: 1,
                items: {
                    $map: {
                        input: '$items',
                        as: 'it',
                        in: {
                            _id: '$$it._id',
                            name: '$$it.name',
                            shortCodes: '$$it.shortCodes',
                            dietary: '$$it.dietary',
                            dietaryShort: '$$it.dietaryShort',
                            basePrice: '$$it.basePrice',
                            costPrice: '$$it.costPrice',
                            isVariation: '$$it.isVariation',
                            online: '$$it.online',
                            takeAway: '$$it.takeAway',
                            dineIn: '$$it.dineIn',
                            isActive: '$$it.isActive',
                            isMeasurementBased: '$$it.isMeasurementBased',
                            measurementConfig: '$$it.measurementConfig',
                            variations: '$$it.variations',
                            addons: '$$it.addons',
                            createdAt: '$$it.createdAt',
                            updatedAt: '$$it.updatedAt',
                        },
                    },
                },
            },
        },

        /* ─── 13. SORT by category name ─── */
        { $sort: { category: 1 } },
    ]);
};
