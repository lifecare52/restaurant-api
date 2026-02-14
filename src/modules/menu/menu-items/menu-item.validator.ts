import Joi from 'joi';

const objectId = Joi.string().length(24).hex();

export const createMenuItemSchema = Joi.object({
    name: Joi.string().trim().min(2).required(),
    shortCodes: Joi.array()
        .items(Joi.string().trim().min(1))
        .min(1)
        .max(2)
        .unique((a, b) => a.toLowerCase() === b.toLowerCase())
        .messages({ 'array.unique': 'shortCodes must be unique (case-insensitive)' })
        .optional(),
    categoryId: objectId.required(),

    dietary: Joi.string().valid('VEG', 'NON_VEG', 'EGG').required(),

    basePrice: Joi.number().min(0).allow(null).optional(),
    costPrice: Joi.number().min(0).optional(),

    variations: Joi.array()
        .items(
            Joi.object({
                variationId: objectId.required(),
                price: Joi.number().min(0).required(),
                addons: Joi.array()
                    .items(
                        Joi.object({
                            addonId: objectId.required(),
                            isSingleSelect: Joi.boolean().optional(),
                            min: Joi.number().integer().min(0).optional(),
                            max: Joi.number().integer().min(0).optional(),
                            allowedItems: Joi.any().forbidden(),
                        }),
                    )
                    .optional(),
            }),
        )
        .optional(),
    addons: Joi.array()
        .items(
            Joi.object({
                addonId: objectId.required(),
                isSingleSelect: Joi.boolean().optional(),
                min: Joi.number().integer().min(0).optional(),
                max: Joi.number().integer().min(0).optional(),
                allowedItems: Joi.any().forbidden(),
            }),
        )
        .optional(),

    isActive: Joi.boolean().default(true),
});

export const updateMenuItemSchema = Joi.object({
    name: Joi.string().trim().min(2),
    shortCodes: Joi.array()
        .items(Joi.string().trim().min(1))
        .max(2)
        .unique((a, b) => a.toLowerCase() === b.toLowerCase())
        .messages({ 'array.unique': 'shortCodes must be unique (case-insensitive)' })
        .optional(),
    categoryId: objectId,

    dietary: Joi.string().valid('VEG', 'NON_VEG', 'EGG'),

    basePrice: Joi.number().min(0).allow(null),
    costPrice: Joi.number().min(0),

    variations: Joi.array()
        .items(
            Joi.object({
                variationId: objectId.required(),
                addons: Joi.array()
                    .items(Joi.object({
                        addonId: objectId.required(),
                        allowedItems: Joi.array().items(objectId).optional(),
                        isSingleSelect: Joi.boolean().optional(),
                        min: Joi.number().integer().min(0).optional(),
                        max: Joi.number().integer().min(0).optional(),
                    }))
                    .optional(),
            }),
        )
        .optional(),
    addons: Joi.array()
        .items(Joi.object({
            addonId: objectId.required(),
            allowedItems: Joi.array().items(objectId).optional(),
            isSingleSelect: Joi.boolean().optional(),
            min: Joi.number().integer().min(0).optional(),
            max: Joi.number().integer().min(0).optional(),
        }))
        .optional(),

    isActive: Joi.boolean(),
});

export const menuItemListQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    searchText: Joi.string().trim().optional(),
    column: Joi.string().valid('name', 'createdAt', 'updatedAt').default('name'),
    order: Joi.string().valid('ASC', 'DESC').default('ASC'),
});

export const menuItemIdQuerySchema = Joi.object({
    menuItemId: objectId.required(),
});

export const menuItemHeaderSchema = Joi.object({
    'brand-id': objectId.required(),
    'outlet-id': objectId.required(),
});
