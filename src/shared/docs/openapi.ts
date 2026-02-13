export const getOpenApiSpec = () => {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Restaurant Management Backend',
      version: '1.0.0',
      description:
        'API documentation for Users, Brands, and Outlets. All responses follow IApiResponse format.',
    },
    servers: [{ url: '/' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        brandIdHeader: { type: 'apiKey', in: 'header', name: 'brand-id' },
        outletIdHeader: { type: 'apiKey', in: 'header', name: 'outlet-id' },
      },
      schemas: {
        ApiError: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['code', 'message'],
        },
        ApiResponse: {
          type: 'object',
          properties: {
            status: { type: 'boolean' },
            code: { type: 'number' },
            message: { type: 'string' },
            data: { type: 'object', additionalProperties: true },
            errors: {
              type: 'array',
              items: { $ref: '#/components/schemas/ApiError' },
            },
            validationMessages: {
              type: 'array',
              items: { type: 'string' },
            },
            total: { type: 'number' },
          },
          required: ['status', 'code'],
        },
        MetaTypesResponse: {
          type: 'object',
          properties: {
            outletTypes: {
              type: 'array',
              items: { type: 'string', enum: ['bakery', 'restaurant', 'cafe'] },
            },
            cuisineTypes: {
              type: 'array',
              items: { type: 'string', enum: ['Indian', 'Italian', 'Chinese', 'Mexican', 'Thai'] },
            },
          },
          required: ['outletTypes', 'cuisineTypes'],
        },
        LoginRequest: {
          type: 'object',
          properties: {
            username: { type: 'string', minLength: 3 },
            password: { type: 'string', minLength: 6 },
          },
          required: ['username', 'password'],
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            brandId: { type: 'string', nullable: true },
            outletId: { type: 'string', nullable: true, description: 'First outlet assigned (if any)' },
          },
          required: ['token'],
        },
        CreateAdminRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            username: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
            password: {
              type: 'string',
              minLength: 6,
              description:
                'At least 6 chars with uppercase, lowercase, number and special character',
            },
          },
          required: ['name', 'username', 'email', 'password'],
        },
        CreateOwnerRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            username: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            brandId: { type: 'string' },
            outlets: { type: 'array', items: { type: 'string' }, minItems: 1 },
          },
          required: ['name', 'username', 'password', 'brandId', 'outlets'],
        },
        CreateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            username: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            role: { type: 'string', enum: ['PARTNER', 'STAFF'] },
            brandId: { type: 'string' },
            outlets: { type: 'array', items: { type: 'string' }, default: [] },
            permissions: { type: 'array', items: { type: 'string' }, default: [] },
          },
          required: ['name', 'username', 'password', 'role', 'brandId'],
        },
        CreateBrandRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            plan: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                outletLimit: { type: 'number' },
              },
            },
          },
          required: ['name'],
        },
        UpdateBrandRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            plan: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                outletLimit: { type: 'number' },
              },
            },
          },
        },
        CreateOutletRequest: {
          type: 'object',
          properties: {
            basicInfo: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 2 },
                logo: { type: 'string', format: 'uri' },
                cuisineType: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['Indian', 'Italian', 'Chinese', 'Mexican', 'Thai'],
                  },
                },
                outletType: { type: 'string', enum: ['bakery', 'restaurant', 'cafe'] },
              },
              required: ['name', 'outletType'],
            },
            contact: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                phone: { type: 'string', minLength: 6, maxLength: 20 },
                country: { type: 'string' },
                state: { type: 'string' },
                city: { type: 'string' },
                address: { type: 'string' },
              },
              required: ['email', 'phone', 'country', 'state', 'city', 'address'],
            },
            settings: {
              type: 'object',
              properties: {
                gstNo: { type: 'string' },
                currency: { type: 'string' },
                CGST: { type: 'number', minimum: 0, maximum: 100 },
                SGST: { type: 'number', minimum: 0, maximum: 100 },
              },
            },
          },
          required: ['basicInfo', 'contact'],
        },
        UpdateOutletRequest: {
          type: 'object',
          properties: {
            basicInfo: {
              type: 'object',
              properties: {
                name: { type: 'string', minLength: 2 },
                logo: { type: 'string', format: 'uri' },
                cuisineType: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: ['Indian', 'Italian', 'Chinese', 'Mexican', 'Thai'],
                  },
                },
                outletType: { type: 'string', enum: ['bakery', 'restaurant', 'cafe'] },
              },
            },
            contact: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                phone: { type: 'string', minLength: 6, maxLength: 20 },
                country: { type: 'string' },
                state: { type: 'string' },
                city: { type: 'string' },
                address: { type: 'string' },
              },
            },
            settings: {
              type: 'object',
              properties: {
                gstNo: { type: 'string' },
                currency: { type: 'string' },
                CGST: { type: 'number', minimum: 0, maximum: 100 },
                SGST: { type: 'number', minimum: 0, maximum: 100 },
              },
            },
          },
        },
        Category: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            name: { type: 'string' },
            onlineName: { type: 'string' },
            logo: { type: 'string', format: 'uri' },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
          required: ['_id', 'brandId', 'outletId', 'name', 'isActive', 'isDelete'],
        },
        CreateCategoryRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            onlineName: { type: 'string', minLength: 2 },
            logo: { type: 'string', format: 'uri' },
            isActive: { type: 'boolean', default: true },
          },
          required: ['name'],
        },
        UpdateCategoryRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            onlineName: { type: 'string', minLength: 2 },
            logo: { type: 'string', format: 'uri' },
            isActive: { type: 'boolean' },
          },
        },
        MenuItem: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            name: { type: 'string' },
            shortCodes: { type: 'array', items: { type: 'string' }, maxItems: 2, uniqueItems: true, description: 'Up to 2 codes; unique per brand+outlet (case-insensitive)' },
            categoryId: { type: 'string' },
            dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
            basePrice: { type: 'number', nullable: true },
            costPrice: { type: 'number' },
            profitPercentage: { type: 'number' },
            hasVariation: { type: 'boolean' },
            variationGroupIds: { type: 'array', items: { type: 'string' } },
            addonGroupIds: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
          required: [
            '_id',
            'brandId',
            'outletId',
            'name',
            'categoryId',
            'dietary',
            'hasVariation',
            'isActive',
            'isDelete',
          ],
        },
        AddonItemSimple: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number', minimum: 0 },
            sapCode: { type: 'string' },
            dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
            available: { type: 'boolean' },
          },
          required: ['_id', 'name', 'price', 'available'],
        },
        AddonGroupSimple: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/AddonItemSimple' } },
          },
          required: ['name', 'items'],
        },
        VariationWithAddonsSimple: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            price: { type: 'number', minimum: 0 },
            addons: { type: 'array', items: { $ref: '#/components/schemas/AddonGroupSimple' } },
          },
          required: ['name', 'price', 'addons'],
        },
        MenuItemWithNested: {
          allOf: [
            { $ref: '#/components/schemas/MenuItem' },
            {
              type: 'object',
              properties: {
                variations: { type: 'array', items: { $ref: '#/components/schemas/VariationWithAddonsSimple' } },
                addons: { type: 'array', items: { $ref: '#/components/schemas/AddonGroupSimple' } },
              },
            },
          ],
        },
        CreateMenuItemRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            shortCodes: { type: 'array', items: { type: 'string' }, maxItems: 2, uniqueItems: true, description: 'Up to 2 codes; unique per brand+outlet (case-insensitive)' },
            categoryId: { type: 'string' },
            dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
            basePrice: { type: 'number', nullable: true },
            costPrice: { type: 'number' },
            profitPercentage: { type: 'number' },
            hasVariation: { type: 'boolean', default: false },
            variationGroupIds: { type: 'array', items: { type: 'string' } },
            addonGroupIds: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean', default: true },
          },
          required: ['name', 'categoryId', 'dietary'],
        },
        UpdateMenuItemRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            shortCodes: { type: 'array', items: { type: 'string' }, maxItems: 2, uniqueItems: true, description: 'Up to 2 codes; unique per brand+outlet (case-insensitive)' },
            categoryId: { type: 'string' },
            dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
            basePrice: { type: 'number', nullable: true },
            costPrice: { type: 'number' },
            profitPercentage: { type: 'number' },
            hasVariation: { type: 'boolean' },
            variationGroupIds: { type: 'array', items: { type: 'string' } },
            addonGroupIds: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
          },
        },
        Variation: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            name: { type: 'string' },
            department: {
              type: 'string',
              enum: ['SIZE', 'PORTION', 'QUANTITY', 'WEIGHT', 'VOLUME', 'PACK', 'FLAVOR', 'TOPPING', 'STYLE', 'CUSTOM'],
            },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
          required: ['_id', 'brandId', 'outletId', 'name', 'department', 'isActive', 'isDelete'],
        },
        CreateVariationRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            department: {
              type: 'string',
              enum: ['SIZE', 'PORTION', 'QUANTITY', 'WEIGHT', 'VOLUME', 'PACK', 'FLAVOR', 'TOPPING', 'STYLE', 'CUSTOM'],
            },
            isActive: { type: 'boolean', default: true },
          },
          required: ['name', 'department'],
        },
        UpdateVariationRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            department: {
              type: 'string',
              enum: ['SIZE', 'PORTION', 'QUANTITY', 'WEIGHT', 'VOLUME', 'PACK', 'FLAVOR', 'TOPPING', 'STYLE', 'CUSTOM'],
            },
            isActive: { type: 'boolean' },
          },
        },
        MenuItemVariant: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            menuItemId: { type: 'string' },
            variationId: { type: 'string' },
            price: { type: 'number', minimum: 0 },
            isActive: { type: 'boolean' },
            isDefault: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
          required: [
            '_id',
            'brandId',
            'outletId',
            'menuItemId',
            'variationId',
            'price',
            'isActive',
            'isDelete',
          ],
        },
        CreateMenuItemVariantRequest: {
          type: 'object',
          properties: {
            menuItemId: { type: 'string' },
            variationId: { type: 'string' },
            price: { type: 'number', minimum: 0 },
            isActive: { type: 'boolean', default: true },
            isDefault: { type: 'boolean', default: false },
          },
          required: ['menuItemId', 'variationId', 'price'],
        },
        UpdateMenuItemVariantRequest: {
          type: 'object',
          properties: {
            price: { type: 'number', minimum: 0 },
            isActive: { type: 'boolean' },
            isDefault: { type: 'boolean' },
          },
        },
        Addon: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            name: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  price: { type: 'number', minimum: 0 },
                  sapCode: { type: 'string' },
                  dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
                  available: { type: 'boolean' },
                },
                required: ['name', 'price'],
              },
            },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
          required: ['_id', 'brandId', 'outletId', 'name', 'items', 'isActive', 'isDelete'],
        },
        CreateAddonRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1 },
                  price: { type: 'number', minimum: 0 },
                  sapCode: { type: 'string' },
                  dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
                  available: { type: 'boolean' },
                },
                required: ['name', 'price'],
              },
            },
            isActive: { type: 'boolean', default: true },
          },
          required: ['name', 'items'],
        },
        UpdateAddonRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 1 },
                  price: { type: 'number', minimum: 0 },
                  sapCode: { type: 'string' },
                  dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
                  available: { type: 'boolean' },
                },
                required: ['name', 'price'],
              },
            },
            isActive: { type: 'boolean' },
          },
        },
        MenuItemAddon: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            menuItemId: { type: 'string' },
            addonId: { type: 'string' },
            menuItemVariantId: { type: 'string', nullable: true },
            allowedItemIds: { type: 'array', items: { type: 'string' } },
            isSingleSelect: { type: 'boolean' },
            min: { type: 'number', minimum: 0 },
            max: { type: 'number', minimum: 1 },
            allowedItems: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  price: { type: 'number', minimum: 0 },
                  sapCode: { type: 'string' },
                  dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
                  available: { type: 'boolean' },
                },
                required: ['_id', 'name', 'price'],
              },
            },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
          required: ['_id', 'brandId', 'outletId', 'menuItemId', 'addonId', 'isActive', 'isDelete'],
        },
        CreateMenuItemAddonRequest: {
          type: 'object',
          properties: {
            menuItemId: { type: 'string' },
            addonId: { type: 'string' },
            menuItemVariantId: { type: 'string' },
            allowedItemIds: { type: 'array', items: { type: 'string' } },
            isSingleSelect: { type: 'boolean' },
            min: { type: 'number', minimum: 0 },
            max: { type: 'number', minimum: 1 },
            isActive: { type: 'boolean', default: true },
          },
          required: ['menuItemId', 'addonId'],
        },
        UpdateMenuItemAddonRequest: {
          type: 'object',
          properties: {
            allowedItemIds: { type: 'array', items: { type: 'string' } },
            isSingleSelect: { type: 'boolean' },
            min: { type: 'number', minimum: 0 },
            max: { type: 'number', minimum: 1 },
            isActive: { type: 'boolean' },
          },
        },
      },
    },
    tags: [
      { name: 'Users' },
      { name: 'Brands' },
      { name: 'Outlets' },
      { name: 'Meta' },
      { name: 'Categorys', description: 'Requires brand-id for detail/update/delete; brand-id and outlet-id for create/list.' },
      { name: 'Menu-Items', description: 'Requires brand-id and outlet-id on all endpoints. Set via Authorize.' },
      { name: 'Variations', description: 'Requires brand-id and outlet-id on all endpoints. Set via Authorize.' },
      { name: 'Menu-Item-Variants', description: 'Requires brand-id and outlet-id on all endpoints. Set via Authorize.' },
    ],
    paths: {
      '/api/v1/meta/types': {
        get: {
          tags: ['Meta'],
          summary: 'Get outlet and cuisine types',
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MetaTypesResponse' },
                        },
                      },
                    ],
                  },
                  examples: {
                    success: {
                      value: {
                        status: true,
                        code: 200,
                        data: {
                          outletTypes: ['bakery', 'restaurant', 'cafe'],
                          cuisineTypes: ['Indian', 'Italian', 'Chinese', 'Mexican', 'Thai'],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/users/login': {
        post: {
          tags: ['Users'],
          summary: 'Login',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
            },
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/LoginResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/users/admins/login': {
        post: {
          tags: ['Users'],
          summary: 'Admin login',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
            },
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/LoginResponse' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/users/admins/bootstrap': {
        post: {
          tags: ['Users'],
          summary: 'Create first admin (bootstrap)',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateAdminRequest' } },
            },
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Category' },
                        },
                      },
                    ],
                  },
                  examples: {
                    success: {
                      value: {
                        status: true,
                        code: 201,
                        data: {
                          _id: 'c123',
                          brandId: 'b123',
                          outletId: 'o123',
                          name: 'Main Course',
                          onlineName: 'Main Course',
                          logo: 'https://cdn.example.com/logo.png',
                          isActive: true,
                          isDelete: false,
                          createdAt: '2026-02-03T10:00:00.000Z',
                          updatedAt: '2026-02-03T10:00:00.000Z',
                        },
                      },
                    },
                  },
                },
              },
            },
            403: {
              description: 'Admin already exists',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/users/admins': {
        post: {
          tags: ['Users'],
          summary: 'Create admin (ADMIN only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateAdminRequest' } },
            },
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/users/owners': {
        post: {
          tags: ['Users'],
          summary: 'Create owner (ADMIN only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateOwnerRequest' } },
            },
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/users': {
        post: {
          tags: ['Users'],
          summary: 'Create user (PARTNER/STAFF)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } },
            },
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/brands': {
        post: {
          tags: ['Brands'],
          summary: 'Create brand (ADMIN)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateBrandRequest' } },
            },
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
        get: {
          tags: ['Brands'],
          summary: 'Get brand by id',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'brandId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/Category' },
                          },
                        },
                      },
                    ],
                  },
                  examples: {
                    success: {
                      value: {
                        status: true,
                        code: 200,
                        data: [
                          {
                            _id: 'c123',
                            brandId: 'b123',
                            outletId: 'o123',
                            name: 'Main Course',
                            onlineName: 'Main Course',
                            logo: 'https://cdn.example.com/logo.png',
                            isActive: true,
                            isDelete: false,
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
        patch: {
          tags: ['Brands'],
          summary: 'Update brand',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'brandId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateBrandRequest' } },
            },
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/Category' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/brands/outlets': {
        post: {
          tags: ['Outlets'],
          summary: 'Create outlet',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'brandId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateOutletRequest' } },
            },
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            400: {
              description: 'Plan outlet limit reached or brand not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
        get: {
          tags: ['Outlets'],
          summary: 'List brand outlets',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'brandId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'object',
                            properties: { deleted: { type: 'boolean' } },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
        patch: {
          tags: ['Outlets'],
          summary: 'Update outlet',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'brand-id', in: 'header', required: true, schema: { type: 'string' } },
            { name: 'outlet-id', in: 'header', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateOutletRequest' } },
            },
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/menu/categories': {
        post: {
          tags: ['Categorys'],
          summary: 'Create category',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCategoryRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            400: {
              description: 'Brand or outlet not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
        get: {
          tags: ['Categorys'],
          summary: 'List categories',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, default: 1 },
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, maximum: 100, default: 20 },
            },
            {
              name: 'searchText',
              in: 'query',
              required: false,
              schema: { type: 'string', minLength: 1, maxLength: 100 },
            },
            {
              name: 'column',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['name', 'onlineName', 'createdAt', 'updatedAt'],
                default: 'name',
              },
            },
            {
              name: 'order',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' },
            },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
        patch: {
          tags: ['Categorys'],
          summary: 'Update category',
          description: 'Mandatory header: brand-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
          parameters: [
            { name: 'categoryId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateCategoryRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
        delete: {
          tags: ['Categorys'],
          summary: 'Delete category',
          description: 'Mandatory header: brand-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
          parameters: [
            { name: 'categoryId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/menu/categories/detail': {
        get: {
          tags: ['Categorys'],
          summary: 'Get category by id',
          description: 'Mandatory header: brand-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'categoryId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/menu/menu-items': {
        post: {
          tags: ['Menu-Items'],
          summary: 'Create menu item',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateMenuItemRequest' },
              },
            },
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            400: {
              description: 'Brand or outlet not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
        get: {
          tags: ['Menu-Items'],
          summary: 'List menu items',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'page', in: 'query', required: false, schema: { type: 'number', minimum: 1, default: 1 } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'number', minimum: 1, maximum: 100, default: 20 } },
            { name: 'searchText', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'column', in: 'query', required: false, schema: { type: 'string', enum: ['name', 'createdAt', 'updatedAt'], default: 'name' } },
            { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' } },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/MenuItemWithNested' },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
        patch: {
          tags: ['Menu-Items'],
          summary: 'Update menu item',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateMenuItemRequest' },
              },
            },
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
        delete: {
          tags: ['Menu-Items'],
          summary: 'Delete menu item',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/menu/menu-items/detail': {
        get: {
          tags: ['Menu-Items'],
          summary: 'Get menu item by id',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/MenuItemWithNested' },
                        },
                      },
                    ],
                  },
                },
              },
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
              },
            },
          },
        },
      },
      '/api/v1/menu/variations': {
        post: {
          tags: ['Variations'],
          summary: 'Create variation',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2 },
                    department: {
                      type: 'string',
                      enum: ['SIZE', 'PORTION', 'QUANTITY', 'WEIGHT', 'VOLUME', 'PACK', 'FLAVOR', 'TOPPING', 'STYLE', 'CUSTOM'],
                    },
                    isActive: { type: 'boolean', default: true },
                  },
                  required: ['name', 'department'],
                },
              },
            },
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            409: { description: 'Duplicate variation', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        get: {
          tags: ['Variations'],
          summary: 'List variations',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'page', in: 'query', required: false, schema: { type: 'number', minimum: 1, default: 1 } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'number', minimum: 1, maximum: 100, default: 20 } },
            { name: 'searchText', in: 'query', required: false, schema: { type: 'string' } },
            {
              name: 'department',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['SIZE', 'PORTION', 'QUANTITY', 'WEIGHT', 'VOLUME', 'PACK', 'FLAVOR', 'TOPPING', 'STYLE', 'CUSTOM'],
              },
            },
            { name: 'column', in: 'query', required: false, schema: { type: 'string', enum: ['name', 'department', 'createdAt', 'updatedAt'], default: 'name' } },
            { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        patch: {
          tags: ['Variations'],
          summary: 'Update variation',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'variationId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2 },
                    department: {
                      type: 'string',
                      enum: ['SIZE', 'PORTION', 'QUANTITY', 'WEIGHT', 'VOLUME', 'PACK', 'FLAVOR', 'TOPPING', 'STYLE', 'CUSTOM'],
                    },
                    isActive: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            409: { description: 'Duplicate variation', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        delete: {
          tags: ['Variations'],
          summary: 'Delete variation',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'variationId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
      },
      '/api/v1/menu/variations/detail': {
        get: {
          tags: ['Variations'],
          summary: 'Get variation by id',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'variationId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
      },
      '/api/v1/menu/menu-item-variants': {
        post: {
          tags: ['Menu-Item-Variants'],
          summary: 'Attach variation to menu item with price',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateMenuItemVariantRequest' } },
            },
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            400: { description: 'Brand, outlet, item or variation not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            409: { description: 'Duplicate mapping', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        get: {
          tags: ['Menu-Item-Variants'],
          summary: 'List menu item variants',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'page', in: 'query', required: false, schema: { type: 'number', minimum: 1, default: 1 } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'number', minimum: 1, maximum: 100, default: 20 } },
            { name: 'menuItemId', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'menuItemVariantId', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'column', in: 'query', required: false, schema: { type: 'string', enum: ['createdAt', 'updatedAt'], default: 'createdAt' } },
            { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        patch: {
          tags: ['Menu-Item-Variants'],
          summary: 'Update menu item variant price or status',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemVariantId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateMenuItemVariantRequest' } },
            },
          },
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        delete: {
          tags: ['Menu-Item-Variants'],
          summary: 'Delete menu item variant mapping',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemVariantId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
      },
      '/api/v1/menu/menu-item-variants/detail': {
        get: {
          tags: ['Menu-Item-Variants'],
          summary: 'Get menu item variant by id',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemVariantId', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
      },
      '/api/v1/menu/addons': {
        post: {
          tags: ['Addons'],
          summary: 'Create addon',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAddonRequest' } } },
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            409: { description: 'Duplicate addon', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        get: {
          tags: ['Addons'],
          summary: 'List addons',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'page', in: 'query', required: false, schema: { type: 'number', minimum: 1, default: 1 } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'number', minimum: 1, maximum: 100, default: 20 } },
            { name: 'searchText', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'column', in: 'query', required: false, schema: { type: 'string', enum: ['name', 'createdAt', 'updatedAt', 'isActive'], default: 'name' } },
            { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        patch: {
          tags: ['Addons'],
          summary: 'Update addon',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'addonId', in: 'query', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateAddonRequest' } } },
          },
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            409: { description: 'Duplicate addon', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        delete: {
          tags: ['Addons'],
          summary: 'Delete addon',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'addonId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
      },
      '/api/v1/menu/addons/detail': {
        get: {
          tags: ['Addons'],
          summary: 'Get addon by id',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'addonId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
      },
      '/api/v1/menu/menu-item-addons': {
        post: {
          tags: ['Menu-Item-Addons'],
          summary: 'Attach addon to menu item (optionally per menu item variant)',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMenuItemAddonRequest' } } },
          },
          responses: {
            201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            400: { description: 'Brand, outlet, item, addon or variant not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            409: { description: 'Duplicate mapping', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        get: {
          tags: ['Menu-Item-Addons'],
          summary: 'List menu item addons',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'page', in: 'query', required: false, schema: { type: 'number', minimum: 1, default: 1 } },
            { name: 'limit', in: 'query', required: false, schema: { type: 'number', minimum: 1, maximum: 100, default: 20 } },
            { name: 'menuItemId', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'addonId', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'menuItemVariantId', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'column', in: 'query', required: false, schema: { type: 'string', enum: ['createdAt', 'updatedAt'], default: 'createdAt' } },
            { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' } },
          ],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        patch: {
          tags: ['Menu-Item-Addons'],
          summary: 'Update menu item addon allowed item IDs or status',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'menuItemAddonId', in: 'query', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateMenuItemAddonRequest' } } },
          },
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
        delete: {
          tags: ['Menu-Item-Addons'],
          summary: 'Delete menu item addon mapping',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'menuItemAddonId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
      },
      '/api/v1/menu/menu-item-addons/detail': {
        get: {
          tags: ['Menu-Item-Addons'],
          summary: 'Get menu item addon by id',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'menuItemAddonId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
            404: { description: 'Not Found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          },
        },
      },
    }
  };
  return spec;
};
