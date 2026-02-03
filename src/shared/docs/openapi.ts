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
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
          required: ['email', 'password'],
        },
        CreateAdminRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
          required: ['name', 'email', 'password'],
        },
        CreateOwnerRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            brandName: { type: 'string', minLength: 2 },
            plan: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                outletLimit: { type: 'number', minimum: 1, default: 10 },
              },
            },
          },
          required: ['name', 'email', 'password', 'brandName'],
        },
        CreateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            role: { type: 'string', enum: ['PARTNER', 'STAFF'] },
            brandId: { type: 'string' },
            outlets: { type: 'array', items: { type: 'string' }, default: [] },
            permissions: { type: 'array', items: { type: 'string' }, default: [] },
          },
          required: ['name', 'email', 'password', 'role', 'brandId'],
        },
        CreateBrandRequest: {
          type: 'object',
          properties: {
            ownerId: { type: 'string' },
            name: { type: 'string', minLength: 2 },
            plan: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                outletLimit: { type: 'number' },
              },
            },
          },
          required: ['ownerId', 'name'],
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
      },
    },
    tags: [
      { name: 'Users' },
      { name: 'Brands' },
      { name: 'Outlets' },
      { name: 'Meta' },
      { name: 'Menu' },
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
                          data: { $ref: '#/components/schemas/Category' },
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
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'x-brand-id', in: 'header', required: true, schema: { type: 'string' } },
            { name: 'x-outlet-id', in: 'header', required: true, schema: { type: 'string' } },
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
          tags: ['Menu'],
          summary: 'Create category',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'brandId', in: 'header', required: true, schema: { type: 'string' } },
            { name: 'outletId', in: 'header', required: true, schema: { type: 'string' } },
          ],
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
          tags: ['Menu'],
          summary: 'List categories',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'brandId', in: 'header', required: true, schema: { type: 'string' } },
            { name: 'outletId', in: 'header', required: true, schema: { type: 'string' } },
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
          tags: ['Menu'],
          summary: 'Update category',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'brandId', in: 'header', required: true, schema: { type: 'string' } },
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
          tags: ['Menu'],
          summary: 'Delete category',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'brandId', in: 'header', required: true, schema: { type: 'string' } },
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
          tags: ['Menu'],
          summary: 'Get category by id',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'brandId', in: 'header', required: true, schema: { type: 'string' } },
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
    },
  };
  return spec;
};
