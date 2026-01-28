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
      },
    },
    tags: [{ name: 'Users' }, { name: 'Brands' }, { name: 'Outlets' }, { name: 'Meta' }],
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
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
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
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } },
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
      },
      '/api/v1/brands/{brandId}': {
        get: {
          tags: ['Brands'],
          summary: 'Get brand by id',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'brandId', in: 'path', required: true, schema: { type: 'string' } }],
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
        patch: {
          tags: ['Brands'],
          summary: 'Update brand',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'brandId', in: 'path', required: true, schema: { type: 'string' } }],
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
      '/api/v1/brands/{brandId}/outlets': {
        post: {
          tags: ['Outlets'],
          summary: 'Create outlet',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'brandId', in: 'path', required: true, schema: { type: 'string' } }],
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
          parameters: [{ name: 'brandId', in: 'path', required: true, schema: { type: 'string' } }],
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
      },
      '/api/v1/brands/{brandId}/outlets/{outletId}': {
        patch: {
          tags: ['Outlets'],
          summary: 'Update outlet',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'brandId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'outletId', in: 'path', required: true, schema: { type: 'string' } },
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
    },
  };
  return spec;
};
