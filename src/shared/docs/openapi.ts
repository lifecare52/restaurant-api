export const getOpenApiSpec = () => {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Restaurant Management Backend',
      version: '1.0.0',
      description:
        'API documentation for Users, Brands, and Outlets. All responses follow IApiResponse format.'
    },
    servers: [{ url: '/' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        brandIdHeader: { type: 'apiKey', in: 'header', name: 'brand-id' },
        outletIdHeader: { type: 'apiKey', in: 'header', name: 'outlet-id' }
      },
      schemas: {
        Tax: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            brandId: {
              type: 'string'
            },
            outletId: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            rate: {
              type: 'number'
            },
            type: {
              type: 'string',
              enum: ['PERCENTAGE', 'FLAT_AMOUNT']
            },
            isInclusive: {
              type: 'boolean'
            },
            calculationMethod: {
              type: 'string',
              enum: ['STANDARD', 'CUMULATIVE']
            },
            applicableOrderTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['DINE_IN', 'TAKE_AWAY', 'ONLINE']
              }
            },
            isActive: {
              type: 'boolean'
            },
            isDelete: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string'
            },
            updatedAt: {
              type: 'string'
            }
          },
          required: [
            '_id',
            'brandId',
            'outletId',
            'name',
            'rate',
            'type',
            'isInclusive',
            'calculationMethod',
            'applicableOrderTypes',
            'isActive',
            'isDelete'
          ]
        },
        TaxGroup: {
          type: 'object',
          properties: {
            _id: {
              type: 'string'
            },
            brandId: {
              type: 'string'
            },
            outletId: {
              type: 'string'
            },
            name: {
              type: 'string'
            },
            taxes: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Tax'
              }
            },
            isActive: {
              type: 'boolean'
            },
            isDelete: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string'
            },
            updatedAt: {
              type: 'string'
            }
          },
          required: ['_id', 'brandId', 'outletId', 'name', 'taxes', 'isActive', 'isDelete']
        },
        CreateTaxRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1
            },
            rate: {
              type: 'number',
              minimum: 0
            },
            type: {
              type: 'string',
              enum: ['PERCENTAGE', 'FLAT_AMOUNT'],
              default: 'PERCENTAGE'
            },
            isInclusive: {
              type: 'boolean',
              default: false
            },
            calculationMethod: {
              type: 'string',
              enum: ['STANDARD', 'CUMULATIVE'],
              default: 'STANDARD'
            },
            applicableOrderTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['DINE_IN', 'TAKE_AWAY', 'ONLINE']
              },
              default: ['DINE_IN', 'TAKE_AWAY', 'ONLINE']
            },
            isActive: {
              type: 'boolean',
              default: true
            }
          },
          required: ['name', 'rate']
        },
        UpdateTaxRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1
            },
            rate: {
              type: 'number',
              minimum: 0
            },
            type: {
              type: 'string',
              enum: ['PERCENTAGE', 'FLAT_AMOUNT']
            },
            isInclusive: {
              type: 'boolean'
            },
            calculationMethod: {
              type: 'string',
              enum: ['STANDARD', 'CUMULATIVE']
            },
            applicableOrderTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['DINE_IN', 'TAKE_AWAY', 'ONLINE']
              }
            },
            isActive: {
              type: 'boolean'
            }
          }
        },
        CreateTaxGroupRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1
            },
            taxes: {
              type: 'array',
              items: {
                type: 'string'
              },
              minItems: 1
            },
            isActive: {
              type: 'boolean',
              default: true
            }
          },
          required: ['name', 'taxes']
        },
        UpdateTaxGroupRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1
            },
            taxes: {
              type: 'array',
              items: {
                type: 'string'
              },
              minItems: 1
            },
            isActive: {
              type: 'boolean'
            }
          }
        },
        Zone: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            name: { type: 'string' },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          },
          required: ['_id', 'brandId', 'outletId', 'name', 'isActive', 'isDelete']
        },
        CreateZoneRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            isActive: { type: 'boolean', default: true }
          },
          required: ['name']
        },
        UpdateZoneRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            isActive: { type: 'boolean' }
          }
        },
        Table: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            zoneId: { type: 'string' },
            name: { type: 'string' },
            capacity: { type: 'number' },
            status: {
              type: 'integer',
              enum: [1, 2, 3, 4, 5],
              description: '1=AVAILABLE, 2=OCCUPIED, 3=BILL_PRINTED, 4=CLEANING, 5=RESERVED'
            },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          },
          required: [
            '_id',
            'brandId',
            'outletId',
            'name',
            'capacity',
            'status',
            'isActive',
            'isDelete'
          ]
        },
        CreateTableRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            capacity: { type: 'number', minimum: 1 },
            zoneId: { type: 'string' },
            status: {
              type: 'integer',
              enum: [1, 2, 3, 4, 5],
              description: '1=AVAILABLE, 2=OCCUPIED, 3=BILL_PRINTED, 4=CLEANING, 5=RESERVED'
            },
            isActive: { type: 'boolean', default: true }
          },
          required: ['name']
        },
        UpdateTableRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            capacity: { type: 'number', minimum: 1 },
            zoneId: { type: 'string', nullable: true },
            status: {
              type: 'integer',
              enum: [1, 2, 3, 4, 5],
              description: '1=AVAILABLE, 2=OCCUPIED, 3=BILL_PRINTED, 4=CLEANING, 5=RESERVED'
            },
            isActive: { type: 'boolean' }
          }
        },
        UpdateTableStatusRequest: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              enum: [1, 2, 3, 4, 5],
              description: '1=AVAILABLE, 2=OCCUPIED, 3=BILL_PRINTED, 4=CLEANING, 5=RESERVED'
            }
          },
          required: ['status']
        },
        Payment: {
          type: 'object',
          description: 'A single payment transaction recorded against an order',
          properties: {
            _id: { type: 'string', description: 'Payment document ID' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            orderId: { type: 'string', description: 'Order this payment belongs to' },
            amount: {
              type: 'number',
              minimum: 0.01,
              description: 'Amount paid in this transaction'
            },
            paymentMethod: {
              type: 'integer',
              enum: [1, 2, 3, 4, 5],
              description: '1=CASH, 2=CARD, 3=UPI, 4=WALLET, 5=ONLINE'
            },
            reference: {
              type: 'string',
              nullable: true,
              maxLength: 100,
              description: 'Optional transaction reference (e.g. UPI txn ID, card last 4)'
            },
            recordedBy: { type: 'string', description: 'Staff user ID who recorded the payment' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: [
            '_id',
            'brandId',
            'outletId',
            'orderId',
            'amount',
            'paymentMethod',
            'recordedBy'
          ]
        },
        RecordPaymentRequest: {
          type: 'object',
          description: 'Payload to record payment transaction(s) (supports split payments)',
          properties: {
            orderId: { type: 'string', description: 'Valid MongoDB ObjectId of the order' },
            amount: {
              type: 'number',
              minimum: 0.01,
              description: 'Amount to pay (for legacy single payment)'
            },
            paymentMethod: {
              type: 'integer',
              enum: [1, 2, 3, 4, 5],
              description: '1=CASH, 2=CARD, 3=UPI, 4=WALLET, 5=ONLINE'
            },
            reference: {
              type: 'string',
              maxLength: 100,
              nullable: true,
              description: 'Optional transaction reference'
            },
            payments: {
              type: 'array',
              description: 'Array of payments for split-payment scenarios',
              items: {
                type: 'object',
                properties: {
                  amount: { type: 'number', minimum: 0.01 },
                  paymentMethod: { type: 'integer', enum: [1, 2, 3, 4, 5] },
                  reference: { type: 'string', nullable: true, maxLength: 100 }
                },
                required: ['amount', 'paymentMethod']
              }
            }
          },
          required: ['orderId']
        },
        RecordPaymentResponse: {
          type: 'object',
          description:
            'Response after recording payments — contains saved payments + updated order snapshot',
          properties: {
            payments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Payment' }
            },
            order: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                totalAmount: { type: 'number' },
                paidAmount: { type: 'number' },
                balanceDue: { type: 'number' },
                paymentStatus: {
                  type: 'integer',
                  enum: [1, 2, 3, 4],
                  description: '1=UNPAID, 2=PARTIAL, 3=PAID, 4=REFUNDED'
                },
                paymentMethod: {
                  type: 'integer',
                  enum: [1, 2, 3, 4, 5],
                  nullable: true,
                  description: 'Primary payment method recorded on the order'
                },
                isSplitPayment: {
                  type: 'boolean',
                  description: 'Whether the order was paid via split payments'
                }
              },
              required: [
                '_id',
                'totalAmount',
                'paidAmount',
                'balanceDue',
                'paymentStatus'
              ]
            }
          },
          required: ['payments', 'order']
        },
        OrderPaymentSummary: {
          type: 'object',
          description: 'All payment records for an order plus running totals',
          properties: {
            orderId: { type: 'string' },
            totalAmount: { type: 'number', description: 'Full bill amount' },
            paidAmount: { type: 'number', description: 'Cumulative amount paid so far' },
            balanceDue: { type: 'number', description: 'Remaining amount to collect' },
            paymentStatus: {
              type: 'integer',
              enum: [1, 2, 3, 4],
              description: '1=UNPAID, 2=PARTIAL, 3=PAID, 4=REFUNDED'
            },
            isSplitPayment: {
              type: 'boolean',
              description: 'Whether the order was paid via multiple distinct payment methods'
            },
            payments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Payment' }
            }
          },
          required: [
            'orderId',
            'totalAmount',
            'paidAmount',
            'balanceDue',
            'paymentStatus',
            'isSplitPayment',
            'payments'
          ]
        },
        ApiError: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' }
          },
          required: ['code', 'message']
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
              items: { $ref: '#/components/schemas/ApiError' }
            },
            validationMessages: {
              type: 'array',
              items: { type: 'string' }
            },
            total: { type: 'number' }
          },
          required: ['status', 'code']
        },
        MetaTypesResponse: {
          type: 'object',
          properties: {
            outletTypes: {
              type: 'array',
              items: { type: 'string', enum: ['bakery', 'restaurant', 'cafe'] }
            },
            cuisineTypes: {
              type: 'array',
              items: { type: 'string', enum: ['Indian', 'Italian', 'Chinese', 'Mexican', 'Thai'] }
            }
          },
          required: ['outletTypes', 'cuisineTypes']
        },
        LoginRequest: {
          type: 'object',
          properties: {
            username: { type: 'string', minLength: 3 },
            password: { type: 'string', minLength: 6 }
          },
          required: ['username', 'password']
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            brandId: { type: 'string', nullable: true },
            outletId: {
              type: 'string',
              nullable: true,
              description: 'First outlet assigned (if any)'
            }
          },
          required: ['token']
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
                'At least 6 chars with uppercase, lowercase, number and special character'
            }
          },
          required: ['name', 'username', 'email', 'password']
        },
        CreateOwnerRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            username: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            brandId: { type: 'string' },
            outlets: { type: 'array', items: { type: 'string' }, minItems: 1 }
          },
          required: ['name', 'username', 'password', 'brandId', 'outlets']
        },
        CreateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            username: { type: 'string', minLength: 3 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            role: { type: 'string', enum: ['PARTNER', 'STAFF'] },
            permissions: { type: 'array', items: { type: 'string' }, default: [] },
            isActive: { type: 'boolean', default: true },
            salary: { type: 'number' }
          },
          required: ['name', 'username', 'password', 'role']
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
            role: { type: 'string', enum: ['PARTNER', 'STAFF'] },
            outlets: { type: 'array', items: { type: 'string' } },
            permissions: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
            salary: { type: 'number' }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['PARTNER', 'STAFF', 'ADMIN', 'OWNER'] },
            brandId: { type: 'string' },
            outlets: { type: 'array', items: { type: 'string' } },
            permissions: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
            salary: { type: 'number' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          }
        },
        CreateBrandRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            plan: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                outletLimit: { type: 'number' }
              }
            }
          },
          required: ['name']
        },
        UpdateBrandRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            plan: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                outletLimit: { type: 'number' }
              }
            }
          }
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
                    enum: ['Indian', 'Italian', 'Chinese', 'Mexican', 'Thai']
                  }
                },
                outletType: { type: 'string', enum: ['bakery', 'restaurant', 'cafe'] }
              },
              required: ['name', 'outletType']
            },
            contact: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                phone: { type: 'string', minLength: 6, maxLength: 20 },
                country: { type: 'string' },
                state: { type: 'string' },
                city: { type: 'string' },
                address: { type: 'string' }
              },
              required: ['email', 'phone', 'country', 'state', 'city', 'address']
            },
            settings: {
              type: 'object',
              properties: {
                gstEnabled: { type: 'boolean', default: false },
                gstNo: { type: 'string' },
                gstScheme: {
                  type: 'string',
                  enum: ['REGULAR', 'COMPOSITION', 'NONE'],
                  default: 'NONE'
                },
                currency: { type: 'string' }
              }
            }
          },
          required: ['basicInfo', 'contact']
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
                    enum: ['Indian', 'Italian', 'Chinese', 'Mexican', 'Thai']
                  }
                },
                outletType: { type: 'string', enum: ['bakery', 'restaurant', 'cafe'] }
              }
            },
            contact: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                phone: { type: 'string', minLength: 6, maxLength: 20 },
                country: { type: 'string' },
                state: { type: 'string' },
                city: { type: 'string' },
                address: { type: 'string' }
              }
            },
            settings: {
              type: 'object',
              properties: {
                gstEnabled: { type: 'boolean' },
                gstNo: { type: 'string' },
                gstScheme: { type: 'string', enum: ['REGULAR', 'COMPOSITION', 'NONE'] },
                currency: { type: 'string' }
              }
            }
          }
        },
        OutletDetail: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            basicInfo: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                logo: { type: 'string', format: 'uri' },
                cuisineType: { type: 'array', items: { type: 'string' } },
                outletType: { type: 'string', enum: ['bakery', 'restaurant', 'cafe'] }
              },
              required: ['name', 'outletType']
            },
            contact: {
              type: 'object',
              properties: {
                email: { type: 'string', format: 'email' },
                phone: { type: 'string' },
                country: { type: 'string' },
                state: { type: 'string' },
                city: { type: 'string' },
                address: { type: 'string' }
              },
              required: ['email', 'phone', 'country', 'state', 'city', 'address']
            },
            settings: {
              type: 'object',
              properties: {
                gstEnabled: { type: 'boolean' },
                gstNo: { type: 'string' },
                gstScheme: { type: 'string', enum: ['REGULAR', 'COMPOSITION', 'NONE'] },
                currency: { type: 'string' }
              }
            },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          },
          required: ['_id', 'basicInfo', 'contact']
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
            updatedAt: { type: 'string' }
          },
          required: ['_id', 'brandId', 'outletId', 'name', 'isActive', 'isDelete']
        },
        CreateCategoryRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            onlineName: { type: 'string', minLength: 2 },
            logo: { type: 'string', format: 'uri' },
            isActive: { type: 'boolean', default: true }
          },
          required: ['name']
        },
        UpdateCategoryRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            onlineName: { type: 'string', minLength: 2 },
            logo: { type: 'string', format: 'uri' },
            isActive: { type: 'boolean' }
          }
        },
        CategoryName: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' }
          },
          required: ['_id', 'name']
        },
        MenuItem: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            name: { type: 'string' },
            shortCodes: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 2,
              uniqueItems: true,
              description: 'Up to 2 codes; unique per brand+outlet (case-insensitive)'
            },
            categoryId: { type: 'string' },
            dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
            dietaryShort: { type: 'string', enum: ['V', 'NV', 'E'] },
            basePrice: { type: 'number', nullable: true },
            costPrice: { type: 'number' },
            isVariation: { type: 'boolean', description: 'True if item has any variants' },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          },
          required: [
            '_id',
            'brandId',
            'outletId',
            'name',
            'categoryId',
            'dietary',
            'isActive',
            'isDelete'
          ]
        },
        AddonItemSimple: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            price: { type: 'number', minimum: 0 },
            sapCode: { type: 'string' },
            dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
            available: { type: 'boolean' }
          },
          required: ['_id', 'name', 'price', 'available']
        },
        AddonGroupSimple: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            items: { type: 'array', items: { $ref: '#/components/schemas/AddonItemSimple' } },
            isSingleSelect: { type: 'boolean' },
            min: { type: 'number', nullable: true },
            max: { type: 'number', nullable: true }
          },
          required: ['name', 'items']
        },
        VariationWithAddonsSimple: {
          type: 'object',
          properties: {
            variationId: { type: 'string' },
            name: { type: 'string' },
            basePrice: { type: 'number', minimum: 0, nullable: true },
            costPrice: { type: 'number', minimum: 0, nullable: true },
            isMeasurementBased: { type: 'boolean' },
            measurementConfig: { $ref: '#/components/schemas/MeasurementConfig' },
            addons: { type: 'array', items: { $ref: '#/components/schemas/AddonGroupSimple' } }
          },
          required: ['variationId', 'name', 'isMeasurementBased', 'addons']
        },
        MenuItemWithNested: {
          allOf: [
            { $ref: '#/components/schemas/MenuItem' },
            {
              type: 'object',
              properties: {
                variations: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/VariationWithAddonsSimple' }
                },
                addons: { type: 'array', items: { $ref: '#/components/schemas/AddonGroupSimple' } }
              }
            }
          ]
        },
        AddonInputCreate: {
          type: 'object',
          description: 'Addon input for create; allowedItems ignored at create time',
          properties: {
            addonId: { type: 'string' },
            isSingleSelect: { type: 'boolean' },
            min: { type: 'number', minimum: 0 },
            max: { type: 'number', minimum: 0 }
          },
          required: ['addonId']
        },
        AddonInputUpdate: {
          type: 'object',
          description: 'Addon input for update; supports allowedItems',
          properties: {
            addonId: { type: 'string' },
            allowedItems: { type: 'array', items: { type: 'string' } },
            isSingleSelect: { type: 'boolean' },
            min: { type: 'number', minimum: 0 },
            max: { type: 'number', minimum: 0 }
          },
          required: ['addonId']
        },
        MeasurementConfig: {
          type: 'object',
          properties: {
            measurementId: { type: 'string' },
            basePrice: { type: 'number', minimum: 0 },
            costPrice: { type: 'number', minimum: 0, nullable: true },
            baseValue: { type: 'number', minimum: 0, nullable: true },
            minValue: { type: 'number', nullable: true },
            maxValue: { type: 'number', nullable: true },
            stepValue: { type: 'number', nullable: true }
          },
          required: ['measurementId', 'basePrice']
        },
        CreateMenuItemRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            shortCodes: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 2,
              uniqueItems: true,
              description: 'Up to 2 codes; unique per brand+outlet (case-insensitive)'
            },
            categoryId: { type: 'string' },
            dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
            basePrice: { type: 'number', nullable: true },
            costPrice: { type: 'number' },
            isMeasurementBased: { type: 'boolean', default: false },
            measurementConfig: { $ref: '#/components/schemas/MeasurementConfig' },
            variations: {
              type: 'array',
              description: 'If provided, creates per-variation prices and per-variation addons',
              items: {
                type: 'object',
                properties: {
                  variationId: { type: 'string' },
                  basePrice: { type: 'number', minimum: 0 },
                  costPrice: { type: 'number', minimum: 0 },
                  isMeasurementBased: { type: 'boolean', default: false },
                  measurementConfig: { $ref: '#/components/schemas/MeasurementConfig' },
                  addons: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/AddonInputCreate'
                    },
                    description:
                      'Objects with addonId, selection rules; allowedItems is ignored on create'
                  }
                },
                required: ['variationId', 'basePrice']
              }
            },
            addons: {
              type: 'array',
              items: { $ref: '#/components/schemas/AddonInputCreate' },
              description:
                'Item-level addons (used only when variations are not provided); allowedItems is ignored on create'
            },
            isActive: { type: 'boolean', default: true }
          },
          required: ['name', 'categoryId', 'dietary']
        },
        UpdateMenuItemRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            shortCodes: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 2,
              uniqueItems: true,
              description: 'Up to 2 codes; unique per brand+outlet (case-insensitive)'
            },
            categoryId: { type: 'string' },
            dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
            basePrice: { type: 'number', nullable: true },
            costPrice: { type: 'number' },
            isMeasurementBased: { type: 'boolean' },
            measurementConfig: { $ref: '#/components/schemas/MeasurementConfig' },
            variations: {
              type: 'array',
              description: 'Optional: provide variation-level addon updates',
              items: {
                type: 'object',
                properties: {
                  variationId: { type: 'string' },
                  isMeasurementBased: { type: 'boolean' },
                  measurementConfig: { $ref: '#/components/schemas/MeasurementConfig' },
                  addons: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/AddonInputUpdate' }
                  }
                },
                required: ['variationId']
              }
            },
            addons: {
              type: 'array',
              description:
                'Optional: item-level addon updates (used when variations are not provided)',
              items: { $ref: '#/components/schemas/AddonInputUpdate' }
            },
            isActive: { type: 'boolean' }
          }
        },
        BulkUpdateMenuItemAvailabilityRequest: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  online: { type: 'boolean' },
                  takeAway: { type: 'boolean' },
                  dineIn: { type: 'boolean' }
                },
                required: ['_id', 'online', 'takeAway', 'dineIn']
              },
              minItems: 1
            }
          },
          required: ['items']
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
              enum: [
                'SIZE',
                'PORTION',
                'QUANTITY',
                'WEIGHT',
                'VOLUME',
                'PACK',
                'FLAVOR',
                'TOPPING',
                'STYLE',
                'CUSTOM'
              ]
            },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          },
          required: ['_id', 'brandId', 'outletId', 'name', 'department', 'isActive', 'isDelete']
        },
        VariationName: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' }
          },
          required: ['_id', 'name']
        },
        CreateVariationRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            department: {
              type: 'string',
              enum: [
                'SIZE',
                'PORTION',
                'QUANTITY',
                'WEIGHT',
                'VOLUME',
                'PACK',
                'FLAVOR',
                'TOPPING',
                'STYLE',
                'CUSTOM'
              ]
            },
            isActive: { type: 'boolean', default: true }
          },
          required: ['name', 'department']
        },
        UpdateVariationRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            department: {
              type: 'string',
              enum: [
                'SIZE',
                'PORTION',
                'QUANTITY',
                'WEIGHT',
                'VOLUME',
                'PACK',
                'FLAVOR',
                'TOPPING',
                'STYLE',
                'CUSTOM'
              ]
            },
            isActive: { type: 'boolean' }
          }
        },
        Measurement: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            measurementType: {
              type: 'string',
              enum: ['WEIGHT', 'VOLUME', 'QUANTITY', 'CUSTOM']
            },
            unit: { type: 'string' },
            baseUnit: { type: 'string' },
            conversionFactor: { type: 'number' },
            isDecimalAllowed: { type: 'boolean' },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          },
          required: [
            '_id',
            'name',
            'measurementType',
            'unit',
            'baseUnit',
            'conversionFactor',
            'isActive',
            'isDelete'
          ]
        },
        CreateMeasurementRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2 },
            measurementType: {
              type: 'string',
              enum: ['WEIGHT', 'VOLUME', 'QUANTITY', 'CUSTOM']
            },
            unit: { type: 'string' },
            baseUnit: { type: 'string' },
            conversionFactor: { type: 'number', minimum: 0 },
            isDecimalAllowed: { type: 'boolean', default: true },
            isActive: { type: 'boolean', default: true }
          },
          required: ['name', 'measurementType', 'unit', 'baseUnit']
        },
        UpdateMeasurementRequest: {
          type: 'object',
          properties: {
            measurementId: { type: 'string' },
            name: { type: 'string', minLength: 2 },
            measurementType: {
              type: 'string',
              enum: ['WEIGHT', 'VOLUME', 'QUANTITY', 'CUSTOM']
            },
            unit: { type: 'string' },
            baseUnit: { type: 'string' },
            conversionFactor: { type: 'number', minimum: 0 },
            isDecimalAllowed: { type: 'boolean' },
            isActive: { type: 'boolean' }
          },
          required: ['measurementId']
        },
        MenuItemVariant: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            menuItemId: { type: 'string' },
            variationId: { type: 'string' },
            basePrice: { type: 'number', minimum: 0 },
            costPrice: { type: 'number', minimum: 0 },
            isMeasurementBased: { type: 'boolean' },
            measurementConfig: { $ref: '#/components/schemas/MeasurementConfig' },
            isActive: { type: 'boolean' },
            isDefault: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          },
          required: [
            '_id',
            'brandId',
            'outletId',
            'menuItemId',
            'variationId',
            'basePrice',
            'isActive',
            'isDelete'
          ]
        },
        CreateMenuItemVariantRequest: {
          type: 'object',
          properties: {
            menuItemId: { type: 'string' },
            variationId: { type: 'string' },
            basePrice: { type: 'number', minimum: 0 },
            costPrice: { type: 'number', minimum: 0 },
            isMeasurementBased: { type: 'boolean', default: false },
            measurementConfig: { $ref: '#/components/schemas/MeasurementConfig' },
            isActive: { type: 'boolean', default: true },
            isDefault: { type: 'boolean', default: false }
          },
          required: ['menuItemId', 'variationId', 'basePrice']
        },
        UpdateMenuItemVariantRequest: {
          type: 'object',
          properties: {
            basePrice: { type: 'number', minimum: 0 },
            costPrice: { type: 'number', minimum: 0 },
            isMeasurementBased: { type: 'boolean' },
            measurementConfig: { $ref: '#/components/schemas/MeasurementConfig' },
            isActive: { type: 'boolean' },
            isDefault: { type: 'boolean' }
          }
        },
        AddonName: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' }
          },
          required: ['_id', 'name']
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
                  available: { type: 'boolean' }
                },
                required: ['name', 'price']
              }
            },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          },
          required: ['_id', 'brandId', 'outletId', 'name', 'items', 'isActive', 'isDelete']
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
                  available: { type: 'boolean' }
                },
                required: ['name', 'price']
              }
            },
            isActive: { type: 'boolean', default: true }
          },
          required: ['name', 'items']
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
                  available: { type: 'boolean' }
                },
                required: ['name', 'price']
              }
            },
            isActive: { type: 'boolean' }
          }
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
                  available: { type: 'boolean' }
                },
                required: ['_id', 'name', 'price']
              }
            },
            isActive: { type: 'boolean' },
            isDelete: { type: 'boolean' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
          },
          required: ['_id', 'brandId', 'outletId', 'menuItemId', 'addonId', 'isActive', 'isDelete']
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
            isActive: { type: 'boolean', default: true }
          },
          required: ['menuItemId', 'addonId']
        },
        CreateBulkMenuItemAddonRequest: {
          type: 'object',
          properties: {
            addonId: { type: 'string' },
            allowedItemsId: { type: 'array', items: { type: 'string' } },
            isSingleSelect: { type: 'boolean' },
            min: { type: 'number', minimum: 0 },
            max: { type: 'number', minimum: 1 },
            isActive: { type: 'boolean', default: true },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  menuId: { type: 'string' },
                  variationId: { type: 'string' }
                },
                required: ['menuId']
              }
            }
          },
          required: ['addonId', 'items']
        },
        UpdateMenuItemAddonRequest: {
          type: 'object',
          properties: {
            allowedItemIds: { type: 'array', items: { type: 'string' } },
            isSingleSelect: { type: 'boolean' },
            min: { type: 'number', minimum: 0 },
            max: { type: 'number', minimum: 1 },
            isActive: { type: 'boolean' }
          }
        },
        CategoryWiseGroup: {
          type: 'object',
          description: 'A category with its non-deleted menu items',
          properties: {
            category: {
              type: 'object',
              properties: {
                _id: { type: 'string' },
                name: { type: 'string' },
                isActive: { type: 'boolean' }
              },
              required: ['_id', 'name', 'isActive']
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string' },
                  name: { type: 'string' },
                  dietary: { type: 'string', enum: ['VEG', 'NON_VEG', 'EGG'] },
                  isActive: { type: 'boolean' }
                },
                required: ['_id', 'name', 'dietary', 'isActive']
              }
            }
          },
          required: ['category', 'items']
        },
        OrderMenuCategoryGroup: {
          type: 'object',
          description:
            'A category with its active menu items, variants, and addons for POS ordering',
          properties: {
            categoryId: { type: 'string' },
            category: { type: 'string' },
            items: {
              type: 'array',
              items: {
                allOf: [
                  { $ref: '#/components/schemas/MenuItemWithNested' },
                  {
                    type: 'object',
                    properties: {
                      taxGroup: {
                        type: 'object',
                        nullable: true,
                        properties: {
                          _id: { type: 'string' },
                          name: { type: 'string' },
                          taxes: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                _id: { type: 'string' },
                                name: { type: 'string' },
                                rate: { type: 'number' },
                                type: { type: 'string' },
                                isInclusive: { type: 'boolean' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          },
          required: ['categoryId', 'category', 'items']
        },
        OrderItemAddon: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            addonId: { type: 'string' },
            addonItemId: { type: 'string' },
            addonName: { type: 'string' },
            addonItemName: { type: 'string', nullable: true },
            price: { type: 'number' },
            quantity: { type: 'number' }
          },
          required: ['addonId', 'addonItemId', 'quantity']
        },
        OrderItem: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            menuItemId: { type: 'string' },
            itemName: { type: 'string' },
            basePrice: { type: 'number' },
            quantity: { type: 'number' },
            variationId: { type: 'string', nullable: true },
            variationName: { type: 'string', nullable: true },
            instruction: { type: 'string', nullable: true },
            totalPrice: { type: 'number' },
            itemStatus: {
              type: 'number',
              enum: [1, 2, 3, 4, 5],
              description: '1=PENDING, 2=PREPARING, 3=READY, 4=SERVED, 5=CANCELLED'
            },
            kotSentAt: { type: 'string', format: 'date-time', nullable: true },
            cancelReason: { type: 'string', nullable: true },
            cancelledAt: { type: 'string', format: 'date-time', nullable: true },
            addons: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItemAddon' }
            }
          },
          required: [
            '_id',
            'menuItemId',
            'itemName',
            'basePrice',
            'quantity',
            'totalPrice',
            'itemStatus'
          ]
        },
        OrderSummary: {
          type: 'object',
          description: 'Lightweight order object returned in list endpoints',
          properties: {
            _id: { type: 'string' },
            orderNumber: { type: 'string' },
            tokenNo: { type: 'string', nullable: true },
            orderType: {
              type: 'number',
              enum: [1, 2, 3],
              description: '1=DINE_IN, 2=TAKEAWAY, 3=DELIVERY'
            },
            tableId: { type: 'string', nullable: true },
            status: {
              type: 'number',
              enum: [1, 2, 3, 4],
              description: '1=OPEN, 2=IN_PROGRESS, 3=COMPLETED, 4=CANCELLED'
            },
            subtotal: { type: 'number' },
            taxAmount: { type: 'number' },
            discountAmount: { type: 'number' },
            totalAmount: { type: 'number' },
            paymentStatus: {
              type: 'number',
              enum: [1, 2, 3, 4],
              description: '1=UNPAID, 2=PARTIAL, 3=PAID, 4=REFUNDED'
            },
            paymentMethod: {
              type: 'number',
              nullable: true,
              enum: [1, 2, 3, 4, 5],
              description: '1=CASH, 2=CARD, 3=UPI, 4=WALLET, 5=ONLINE'
            },
            waiterId: { type: 'string', nullable: true },
            customerId: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true, maxLength: 500 },
            createdAt: { type: 'string', format: 'date-time' }
          },
          required: ['_id', 'orderNumber', 'orderType', 'status', 'totalAmount']
        },
        OrderDetail: {
          allOf: [
            { $ref: '#/components/schemas/OrderSummary' },
            {
              type: 'object',
              properties: {
                kots: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/KOTFriendlyBatch' }
                },
                payments: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Payment' }
                },
                cancellationReason: { type: 'string', nullable: true },
                closedAt: { type: 'string', format: 'date-time', nullable: true },
                confirmedAt: { type: 'string', format: 'date-time', nullable: true }
              }
            }
          ]
        },
        AddonItemDTO: {
          type: 'object',
          properties: {
            addonId: { type: 'string' },
            addonItemId: { type: 'string' },
            quantity: { type: 'number', minimum: 1 }
          },
          required: ['addonId', 'addonItemId', 'quantity']
        },
        AddItemToOrderItemDTO: {
          type: 'object',
          properties: {
            menuItemId: { type: 'string' },
            quantity: { type: 'number', minimum: 1 },
            variationId: { type: 'string' },
            instruction: {
              type: 'string',
              maxLength: 300,
              nullable: true,
              example: 'No onion, less spicy'
            },
            addons: { type: 'array', items: { $ref: '#/components/schemas/AddonItemDTO' } }
          },
          required: ['menuItemId', 'quantity']
        },
        CreateOrderRequest: {
          type: 'object',
          properties: {
            orderType: {
              type: 'number',
              enum: [1, 2, 3],
              description:
                '1=DINE_IN (requires tableId), 2=TAKEAWAY, 3=DELIVERY (requires shippingAddress)'
            },
            tableId: { type: 'string', description: 'Required when orderType=1 (DINE_IN)' },
            customerId: { type: 'string', nullable: true, description: 'Optional customer linked to the order' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/AddItemToOrderItemDTO' },
              minItems: 1
            },
            notes: {
              type: 'string',
              maxLength: 500,
              nullable: true,
              example: 'Urgent order, serve fast'
            },
            shippingAddress: {
              type: 'string',
              description: 'Required when orderType=3 (DELIVERY)'
            }
          },
          required: ['orderType', 'items']
        },
        AddItemsToOrderRequest: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/AddItemToOrderItemDTO' },
              minItems: 1
            }
          },
          required: ['orderId', 'items']
        },
        RemoveOrderItemRequest: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            orderItemId: { type: 'string' },
            cancelReason: { type: 'string', maxLength: 300 }
          },
          required: ['orderId', 'orderItemId']
        },
        UpdateOrderItemRequest: {
          type: 'object',
          description:
            'Update quantity or instruction of a PENDING order item. At least one of quantity or instruction must be provided.',
          properties: {
            orderId: { type: 'string' },
            orderItemId: { type: 'string' },
            quantity: { type: 'number', minimum: 1 },
            instruction: { type: 'string', maxLength: 300 }
          },
          required: ['orderId', 'orderItemId']
        },
        CloseOrderRequest: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            paymentMethod: {
              type: 'number',
              enum: [1, 2, 3, 4, 5],
              description: '1=CASH, 2=CARD, 3=UPI, 4=WALLET, 5=ONLINE'
            }
          },
          required: ['orderId']
        },
        CancelOrderRequest: {
          type: 'object',
          properties: {
            orderId: { type: 'string' },
            cancellationReason: { type: 'string', maxLength: 500 }
          },
          required: ['orderId']
        },
        CustomerTag: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            discountType: { type: 'string', enum: ['PERCENTAGE', 'FLAT', 'NONE'] },
            discountValue: { type: 'number' },
            minOrderAmount: { type: 'number' },
            priority: { type: 'number' },
            isActive: { type: 'boolean' },
            brandId: { type: 'string' }
          },
          required: [
            '_id',
            'brandId',
            'name',
            'discountType',
            'discountValue',
            'priority',
            'isActive'
          ]
        },
        CreateCustomerTagRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            discountType: { type: 'string', enum: ['PERCENTAGE', 'FLAT', 'NONE'] },
            discountValue: { type: 'number', minimum: 0 },
            minOrderAmount: { type: 'number', minimum: 0, default: 0 },
            priority: { type: 'integer', minimum: 0, default: 0 },
            isActive: { type: 'boolean', default: true }
          },
          required: ['name', 'discountType']
        },
        UpdateCustomerTagRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            discountType: { type: 'string', enum: ['PERCENTAGE', 'FLAT', 'NONE'] },
            discountValue: { type: 'number', minimum: 0 },
            minOrderAmount: { type: 'number', minimum: 0 },
            priority: { type: 'integer', minimum: 0 },
            isActive: { type: 'boolean' }
          }
        },
        CustomerOutletStats: {
          type: 'object',
          properties: {
            outletId: { type: 'string' },
            totalOrders: { type: 'number' },
            totalSpent: { type: 'number' },
            lastVisitAt: { type: 'string', format: 'date-time' }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            brandId: { type: 'string' },
            outletId: { type: 'string' },
            name: { type: 'string' },
            mobile: { type: 'string' },
            email: { type: 'string', format: 'email', nullable: true },
            tags: {
              type: 'array',
              items: { $ref: '#/components/schemas/CustomerTag' }
            },
            loyaltyPoints: { type: 'number' },
            totalSpent: { type: 'number' },
            totalOrders: { type: 'number' },
            lastVisitAt: { type: 'string', format: 'date-time', nullable: true },
            creditBalance: { type: 'number' },
            isActive: { type: 'boolean' },
            outletStats: {
              type: 'array',
              items: { $ref: '#/components/schemas/CustomerOutletStats' }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          },
          required: [
            '_id',
            'brandId',
            'outletId',
            'name',
            'mobile',
            'tags',
            'loyaltyPoints',
            'totalSpent',
            'totalOrders',
            'creditBalance',
            'isActive'
          ]
        },
        CreateCustomerRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 120 },
            mobile: { type: 'string', minLength: 6, maxLength: 20 },
            email: { type: 'string', format: 'email', nullable: true },
            tags: { type: 'array', items: { type: 'string' } },
            loyaltyPoints: { type: 'number', minimum: 0, default: 0 },
            totalSpent: { type: 'number', minimum: 0, default: 0 },
            totalOrders: { type: 'integer', minimum: 0, default: 0 },
            lastVisitAt: { type: 'string', format: 'date-time', nullable: true },
            creditBalance: { type: 'number', default: 0 },
            isActive: { type: 'boolean', default: true }
          },
          required: ['name', 'mobile']
        },
        UpdateCustomerRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 120 },
            mobile: { type: 'string', minLength: 6, maxLength: 20 },
            email: { type: 'string', format: 'email', nullable: true },
            tags: { type: 'array', items: { type: 'string' } },
            loyaltyPoints: { type: 'number', minimum: 0 },
            totalSpent: { type: 'number', minimum: 0 },
            totalOrders: { type: 'integer', minimum: 0 },
            lastVisitAt: { type: 'string', format: 'date-time', nullable: true },
            creditBalance: { type: 'number' },
            isActive: { type: 'boolean' }
          }
        },
        AssignCustomerTagsRequest: {
          type: 'object',
          properties: {
            tagIds: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              uniqueItems: true
            }
          },
          required: ['tagIds']
        },
        TokenDisplayItem: {
          type: 'object',
          properties: {
            tokenNo: { type: 'string', nullable: true },
            orderId: { type: 'string' },
            orderNumber: { type: 'string' }
          },
          required: ['orderId', 'orderNumber']
        },
        KOTItem: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderItemId: { type: 'string' },
            quantity: { type: 'number' },
            instruction: {
              type: 'string',
              nullable: true,
              maxLength: 300,
              example: 'No onion, less spicy'
            },
            itemStatus: {
              type: 'number',
              enum: [1, 2, 3, 4, 5],
              description: '1=PENDING, 2=PREPARING, 3=READY, 4=SERVED, 5=CANCELLED'
            },
            preparedAt: { type: 'string', format: 'date-time', nullable: true },
            servedAt: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        KOTDetail: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderId: { type: 'string' },
            kotNumber: { type: 'string' },
            kotType: {
              type: 'number',
              enum: [1, 2, 3],
              description: '1=REGULAR, 2=VOID, 3=REPRINT'
            },
            waiterId: { type: 'string', nullable: true },
            customerId: { type: 'string', nullable: true },
            tokenNo: { type: 'string', nullable: true },
            tableName: { type: 'string', nullable: true },
            notes: {
              type: 'string',
              nullable: true,
              maxLength: 500,
              example: 'Urgent order, serve fast'
            },
            status: {
              type: 'number',
              enum: [1, 2, 3, 4, 5],
              description: '1=PENDING, 2=PREPARING, 3=READY, 4=SERVED, 5=CANCELLED'
            },
            isPrinted: { type: 'boolean' },
            items: { type: 'array', items: { $ref: '#/components/schemas/KOTItem' } },
            createdAt: { type: 'string', format: 'date-time' },
            printLines: {
              type: 'array',
              items: { type: 'string' },
              description: 'Preformatted lines for kitchen printing'
            }
          },
          required: ['_id', 'orderId', 'kotNumber', 'kotType', 'status']
        },
        UpdateKOTStatusRequest: {
          type: 'object',
          properties: {
            kotId: { type: 'string' },
            status: {
              type: 'number',
              enum: [1, 2, 3, 4, 5],
              description:
                '1=PENDING, 2=PREPARING, 3=READY, 4=SERVED, 5=CANCELLED. State machine enforced.'
            }
          },
          required: ['kotId', 'status']
        },
        UpdateKOTItemStatusRequest: {
          type: 'object',
          properties: {
            kotItemId: { type: 'string' },
            status: {
              type: 'number',
              enum: [1, 2, 3, 4, 5],
              description: '1=PENDING, 2=PREPARING, 3=READY, 4=SERVED, 5=CANCELLED'
            }
          },
          required: ['kotItemId', 'status']
        },
        SalesReportItem: {
          type: 'object',
          properties: {
            date: { type: 'string', format: 'date' },
            orderType: {
              type: 'number',
              enum: [1, 2, 3],
              description: '1=DINE_IN, 2=TAKEAWAY, 3=DELIVERY'
            },
            totalOrders: { type: 'number' },
            totalAmount: { type: 'number' },
            tax: { type: 'number' },
            discount: { type: 'number' }
          }
        },
        ItemSalesReportItem: {
          type: 'object',
          properties: {
            menuItemId: { type: 'string' },
            itemName: { type: 'string' },
            variationId: { type: 'string', nullable: true },
            variationName: { type: 'string', nullable: true },
            quantitySold: { type: 'number' },
            totalRevenue: { type: 'number' }
          }
        },
        KOTFriendlyBatch: {
          type: 'object',
          properties: {
            kotNumber: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time', nullable: true },
            items: {
              type: 'array',
              items: {
                allOf: [
                  { $ref: '#/components/schemas/OrderItem' },
                  {
                    type: 'object',
                    properties: {
                      addons: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/OrderItemAddon' }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      }
    },
    tags: [
      { name: 'Users' },
      { name: 'Brands' },
      { name: 'Outlets' },
      { name: 'Meta' },
      {
        name: 'Categories',
        description:
          'Requires brand-id for detail/update/delete; brand-id and outlet-id for create/list.'
      },
      {
        name: 'Menu-Items',
        description: 'Requires brand-id and outlet-id on all endpoints. Set via Authorize.'
      },
      {
        name: 'Variations',
        description: 'Requires brand-id and outlet-id on all endpoints. Set via Authorize.'
      },
      {
        name: 'Menu-Item-Variants',
        description: 'Requires brand-id and outlet-id on all endpoints. Set via Authorize.'
      },
      {
        name: 'Menu-Item-Addons',
        description: 'Requires brand-id and outlet-id on all endpoints. Set via Authorize.'
      },
      {
        name: 'Orders',
        description: 'Requires brand-id and outlet-id on all endpoints. Set via Authorize.'
      },
      {
        name: 'KOTs',
        description: 'Kitchen Order Tickets. Requires brand-id and outlet-id on all endpoints.'
      },
      {
        name: 'Reports',
        description: 'Requires brand-id and outlet-id on all endpoints.'
      }
    ],
    paths: {
      '/api/v1/taxes': {
        get: {
          tags: ['Tax'],
          summary: 'Get all active taxes',
          security: [
            {
              bearerAuth: []
            },
            {
              brandIdHeader: []
            },
            {
              outletIdHeader: []
            }
          ],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: {
                type: 'number',
                default: 1
              }
            },
            {
              name: 'limit',
              in: 'query',
              schema: {
                type: 'number',
                default: 20
              }
            },
            {
              name: 'isActive',
              in: 'query',
              schema: {
                type: 'boolean'
              }
            },
            {
              name: 'column',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['name', 'rate', 'type', 'isActive', 'createdAt', 'updatedAt'],
                default: 'name'
              }
            },
            {
              name: 'order',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['ASC', 'DESC'],
                default: 'ASC'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ApiResponse'
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Tax'],
          summary: 'Create a new tax',
          security: [
            {
              bearerAuth: []
            },
            {
              brandIdHeader: []
            },
            {
              outletIdHeader: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateTaxRequest'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Created',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ApiResponse'
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/taxes/{id}': {
        get: {
          tags: ['Tax'],
          summary: 'Get a specific tax by ID',
          security: [
            {
              bearerAuth: []
            },
            {
              brandIdHeader: []
            },
            {
              outletIdHeader: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Success'
            },
            '404': {
              description: 'Not Found'
            }
          }
        },
        patch: {
          tags: ['Tax'],
          summary: 'Update a specific tax',
          security: [
            {
              bearerAuth: []
            },
            {
              brandIdHeader: []
            },
            {
              outletIdHeader: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateTaxRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Success'
            },
            '404': {
              description: 'Not Found'
            }
          }
        },
        delete: {
          tags: ['Tax'],
          summary: 'Delete a specific tax',
          security: [
            {
              bearerAuth: []
            },
            {
              brandIdHeader: []
            },
            {
              outletIdHeader: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Success'
            },
            '404': {
              description: 'Not Found'
            }
          }
        }
      },
      '/api/v1/taxes/groups': {
        get: {
          tags: ['TaxGroup'],
          summary: 'Get all active tax groups',
          security: [
            {
              bearerAuth: []
            },
            {
              brandIdHeader: []
            },
            {
              outletIdHeader: []
            }
          ],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: {
                type: 'number',
                default: 1
              }
            },
            {
              name: 'limit',
              in: 'query',
              schema: {
                type: 'number',
                default: 20
              }
            },
            {
              name: 'isActive',
              in: 'query',
              schema: {
                type: 'boolean'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Success'
            }
          }
        },
        post: {
          tags: ['TaxGroup'],
          summary: 'Create a new tax group',
          security: [
            {
              bearerAuth: []
            },
            {
              brandIdHeader: []
            },
            {
              outletIdHeader: []
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/CreateTaxGroupRequest'
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Created'
            }
          }
        }
      },
      '/api/v1/taxes/groups/{id}': {
        get: {
          tags: ['TaxGroup'],
          summary: 'Get a specific tax group by ID',
          security: [
            {
              bearerAuth: []
            },
            {
              brandIdHeader: []
            },
            {
              outletIdHeader: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Success'
            },
            '404': {
              description: 'Not Found'
            }
          }
        },
        patch: {
          tags: ['TaxGroup'],
          summary: 'Update a specific tax group',
          security: [
            {
              bearerAuth: []
            },
            {
              brandIdHeader: []
            },
            {
              outletIdHeader: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/UpdateTaxGroupRequest'
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Success'
            },
            '404': {
              description: 'Not Found'
            }
          }
        },
        delete: {
          tags: ['TaxGroup'],
          summary: 'Delete a specific tax group',
          security: [
            {
              bearerAuth: []
            },
            {
              brandIdHeader: []
            },
            {
              outletIdHeader: []
            }
          ],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Success'
            },
            '404': {
              description: 'Not Found'
            }
          }
        }
      },
      '/api/v1/order/menu-items': {
        get: {
          tags: ['Orders'],
          summary: 'List active POS menu items grouped by category',
          description:
            'Fetches the complete menu structure including variants and addons for the POS. Mandatory headers: brand-id, outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
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
                            items: { $ref: '#/components/schemas/OrderMenuCategoryGroup' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
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
                          data: { $ref: '#/components/schemas/MetaTypesResponse' }
                        }
                      }
                    ]
                  },
                  examples: {
                    success: {
                      value: {
                        status: true,
                        code: 200,
                        data: {
                          outletTypes: ['bakery', 'restaurant', 'cafe'],
                          cuisineTypes: ['Indian', 'Italian', 'Chinese', 'Mexican', 'Thai']
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/users/login': {
        post: {
          tags: ['Users'],
          summary: 'Login',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } }
            }
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
                          data: { $ref: '#/components/schemas/LoginResponse' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/users/admins/login': {
        post: {
          tags: ['Users'],
          summary: 'Admin login',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } }
            }
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
                          data: { $ref: '#/components/schemas/LoginResponse' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/users/admins/bootstrap': {
        post: {
          tags: ['Users'],
          summary: 'Create first admin (bootstrap)',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateAdminRequest' } }
            }
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
                          data: { $ref: '#/components/schemas/Category' }
                        }
                      }
                    ]
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
                          updatedAt: '2026-02-03T10:00:00.000Z'
                        }
                      }
                    }
                  }
                }
              }
            },
            403: {
              description: 'Admin already exists',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/users/admins': {
        post: {
          tags: ['Users'],
          summary: 'Create admin (ADMIN only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateAdminRequest' } }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/users/owners': {
        post: {
          tags: ['Users'],
          summary: 'Create owner (ADMIN only)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateOwnerRequest' } }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/users': {
        post: {
          tags: ['Users'],
          summary: 'Create user (PARTNER/STAFF)',
          description:
            "Creates a new user. The `brand-id` header is mandatory. The `outlet-id` header is optional; if provided, it will be added to the user's `outlets` list. Note: `outlets` in payload is ignored; user is assigned only to the outlet in the header (if present).",
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateUserRequest' } }
            }
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
                          data: { $ref: '#/components/schemas/User' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Users'],
          summary: 'List users',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, maximum: 100, default: 20 }
            },
            {
              name: 'searchText',
              in: 'query',
              required: false,
              schema: { type: 'string' }
            },
            {
              name: 'role',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['PARTNER', 'STAFF'] }
            },
            {
              name: 'column',
              in: 'query',
              required: false,
              schema: { type: 'string', default: 'createdAt' }
            },
            {
              name: 'order',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
            }
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
                            items: { $ref: '#/components/schemas/User' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Users'],
          summary: 'Update user',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
          parameters: [{ name: 'userId', in: 'query', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateUserRequest' } }
            }
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
                          data: { $ref: '#/components/schemas/User' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete user (soft delete)',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
          parameters: [{ name: 'userId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/users/detail': {
        get: {
          tags: ['Users'],
          summary: 'Get user details',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
          parameters: [{ name: 'userId', in: 'query', required: true, schema: { type: 'string' } }],
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
                          data: { $ref: '#/components/schemas/User' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/brands': {
        post: {
          tags: ['Brands'],
          summary: 'Create brand (ADMIN)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateBrandRequest' } }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Brands'],
          summary: 'Get brand by id',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
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
                            items: { $ref: '#/components/schemas/Category' }
                          }
                        }
                      }
                    ]
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
                            isDelete: false
                          }
                        ]
                      }
                    }
                  }
                }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Brands'],
          summary: 'Update brand',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateBrandRequest' } }
            }
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
                          data: { $ref: '#/components/schemas/Category' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/brands/outlets': {
        post: {
          tags: ['Outlets'],
          summary: 'Create outlet',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateOutletRequest' } }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            400: {
              description: 'Plan outlet limit reached or brand not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Outlets'],
          summary: 'List brand outlets',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
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
                            properties: { deleted: { type: 'boolean' } }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Outlets'],
          summary: 'Update outlet',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateOutletRequest' } }
            }
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/brands/outlets/detail': {
        get: {
          tags: ['Outlets'],
          summary: 'Get outlet details',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
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
                          data: { $ref: '#/components/schemas/OutletDetail' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/categories': {
        post: {
          tags: ['Categories'],
          summary: 'Create category',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCategoryRequest' }
              }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            400: {
              description: 'Brand or outlet not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Categories'],
          summary: 'List categories',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, maximum: 100, default: 20 }
            },
            {
              name: 'searchText',
              in: 'query',
              required: false,
              schema: { type: 'string', minLength: 1, maxLength: 100 }
            },
            {
              name: 'column',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['name', 'onlineName', 'createdAt', 'updatedAt', 'isActive'],
                default: 'name'
              }
            },
            {
              name: 'order',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' }
            }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Categories'],
          summary: 'Update category',
          description: 'Mandatory header: brand-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
          parameters: [
            { name: 'categoryId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateCategoryRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        delete: {
          tags: ['Categories'],
          summary: 'Delete category',
          description: 'Mandatory header: brand-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
          parameters: [
            { name: 'categoryId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/categories/detail': {
        get: {
          tags: ['Categories'],
          summary: 'Get category by id',
          description: 'Mandatory header: brand-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [] }],
          parameters: [
            { name: 'categoryId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/categories/active': {
        get: {
          tags: ['Categories'],
          summary: 'List active categories (no pagination)',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
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
                            items: { $ref: '#/components/schemas/CategoryName' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/menu/menu-item-addons/addon-mapping': {
        get: {
          tags: ['Menu-Item-Addons'],
          summary: 'Get addon mapping structure',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'addonId', in: 'query', required: false, schema: { type: 'string' } }
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
                            items: {
                              type: 'object',
                              properties: {
                                Category: { type: 'string' },
                                Items: {
                                  type: 'array',
                                  items: {
                                    oneOf: [
                                      {
                                        type: 'object',
                                        properties: {
                                          Name: { type: 'string' },
                                          _id: { type: 'string' }
                                        },
                                        required: ['Name', '_id']
                                      },
                                      {
                                        type: 'object',
                                        properties: {
                                          Name: { type: 'string' },
                                          menuItemId: { type: 'string' },
                                          menuItemVariantId: { type: 'string' }
                                        },
                                        required: ['Name', 'menuItemId', 'menuItemVariantId']
                                      }
                                    ]
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/measurements': {
        get: {
          tags: ['Measurements'],
          summary: 'List measurements',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'searchText',
              in: 'query',
              required: false,
              schema: { type: 'string' }
            },
            {
              name: 'measurementType',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['WEIGHT', 'VOLUME', 'QUANTITY', 'CUSTOM']
              }
            },
            {
              name: 'column',
              in: 'query',
              required: false,
              schema: { type: 'string', default: 'createdAt' }
            },
            {
              name: 'order',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
            }
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
                            items: { $ref: '#/components/schemas/Measurement' }
                          },
                          total: { type: 'number' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        post: {
          tags: ['Measurements'],
          summary: 'Create measurement',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateMeasurementRequest' }
              }
            }
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
                          data: { $ref: '#/components/schemas/Measurement' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Measurements'],
          summary: 'Update measurement',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateMeasurementRequest' }
              }
            }
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
                          data: { $ref: '#/components/schemas/Measurement' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        delete: {
          tags: ['Measurements'],
          summary: 'Delete measurement',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'measurementId',
              in: 'query',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'Deleted',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/measurements/detail': {
        get: {
          tags: ['Measurements'],
          summary: 'Get measurement by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'measurementId',
              in: 'query',
              required: true,
              schema: { type: 'string' }
            }
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
                          data: { $ref: '#/components/schemas/Measurement' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
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
                schema: { $ref: '#/components/schemas/CreateMenuItemRequest' }
              }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            400: {
              description: 'Brand or outlet not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Menu-Items'],
          summary: 'List menu items',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, maximum: 100, default: 20 }
            },
            { name: 'searchText', in: 'query', required: false, schema: { type: 'string' } },
            {
              name: 'column',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: [
                  'name',
                  'shortCodes',
                  'dietary',
                  'basePrice',
                  'createdAt',
                  'updatedAt',
                  'isActive'
                ],
                default: 'name'
              }
            },
            {
              name: 'order',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' }
            }
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
                            items: { $ref: '#/components/schemas/MenuItemWithNested' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Menu-Items'],
          summary: 'Update menu item',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateMenuItemRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        delete: {
          tags: ['Menu-Items'],
          summary: 'Delete menu item',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/menu-items/availability': {
        patch: {
          tags: ['Menu-Items'],
          summary: 'Bulk update menu items availability',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BulkUpdateMenuItemAvailabilityRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            400: {
              description: 'Bad Request',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/menu-items/category-wise': {
        get: {
          tags: ['Menu-Items'],
          summary: 'List menu items grouped by category',
          description:
            'Returns non-deleted menu items (active & inactive) grouped under their non-deleted category. Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
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
                            items: { $ref: '#/components/schemas/CategoryWiseGroup' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/menu-items/detail': {
        get: {
          tags: ['Menu-Items'],
          summary: 'Get menu item by id',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemId', in: 'query', required: true, schema: { type: 'string' } }
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
                          data: { $ref: '#/components/schemas/MenuItemWithNested' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
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
                      enum: [
                        'SIZE',
                        'PORTION',
                        'QUANTITY',
                        'WEIGHT',
                        'VOLUME',
                        'PACK',
                        'FLAVOR',
                        'TOPPING',
                        'STYLE',
                        'CUSTOM'
                      ]
                    },
                    isActive: { type: 'boolean', default: true }
                  },
                  required: ['name', 'department']
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            409: {
              description: 'Duplicate variation',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Variations'],
          summary: 'List variations',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, maximum: 100, default: 20 }
            },
            { name: 'searchText', in: 'query', required: false, schema: { type: 'string' } },
            {
              name: 'department',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: [
                  'SIZE',
                  'PORTION',
                  'QUANTITY',
                  'WEIGHT',
                  'VOLUME',
                  'PACK',
                  'FLAVOR',
                  'TOPPING',
                  'STYLE',
                  'CUSTOM'
                ]
              }
            },
            {
              name: 'column',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['name', 'department', 'createdAt', 'updatedAt', 'isActive'],
                default: 'name'
              }
            },
            {
              name: 'order',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' }
            }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Variations'],
          summary: 'Update variation',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'variationId', in: 'query', required: true, schema: { type: 'string' } }
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
                      enum: [
                        'SIZE',
                        'PORTION',
                        'QUANTITY',
                        'WEIGHT',
                        'VOLUME',
                        'PACK',
                        'FLAVOR',
                        'TOPPING',
                        'STYLE',
                        'CUSTOM'
                      ]
                    },
                    isActive: { type: 'boolean' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            409: {
              description: 'Duplicate variation',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        delete: {
          tags: ['Variations'],
          summary: 'Delete variation',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'variationId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/variations/detail': {
        get: {
          tags: ['Variations'],
          summary: 'Get variation by id',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'variationId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/variations/active': {
        get: {
          tags: ['Variations'],
          summary: 'List active variations (no pagination)',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
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
                            items: { $ref: '#/components/schemas/VariationName' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/menu/menu-item-variants': {
        post: {
          tags: ['Menu-Item-Variants'],
          summary: 'Attach variation to menu item with basePrice (and optional costPrice)',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateMenuItemVariantRequest' }
              }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            400: {
              description: 'Brand, outlet, item or variation not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            409: {
              description: 'Duplicate mapping',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Menu-Item-Variants'],
          summary: 'List menu item variants',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, maximum: 100, default: 20 }
            },
            { name: 'menuItemId', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'menuItemVariantId', in: 'query', required: false, schema: { type: 'string' } },
            {
              name: 'column',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['basePrice', 'costPrice', 'createdAt', 'updatedAt', 'isActive'],
                default: 'createdAt'
              }
            },
            {
              name: 'order',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' }
            }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Menu-Item-Variants'],
          summary: 'Update menu item variant basePrice/costPrice or status',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemVariantId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateMenuItemVariantRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        delete: {
          tags: ['Menu-Item-Variants'],
          summary: 'Delete menu item variant mapping',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemVariantId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/menu-item-variants/detail': {
        get: {
          tags: ['Menu-Item-Variants'],
          summary: 'Get menu item variant by id',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemVariantId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/addons': {
        post: {
          tags: ['Addons'],
          summary: 'Create addon',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateAddonRequest' } }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            409: {
              description: 'Duplicate addon',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Addons'],
          summary: 'List addons',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, maximum: 100, default: 20 }
            },
            { name: 'searchText', in: 'query', required: false, schema: { type: 'string' } },
            {
              name: 'column',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['name', 'createdAt', 'updatedAt', 'isActive'],
                default: 'name'
              }
            },
            {
              name: 'order',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' }
            }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Addons'],
          summary: 'Update addon',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'addonId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateAddonRequest' } }
            }
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            409: {
              description: 'Duplicate addon',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        delete: {
          tags: ['Addons'],
          summary: 'Delete addon',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'addonId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/addons/active': {
        get: {
          tags: ['Addons'],
          summary: 'List active addons (no pagination)',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
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
                            items: { $ref: '#/components/schemas/AddonName' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/menu/addons/detail': {
        get: {
          tags: ['Addons'],
          summary: 'Get addon by id',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'addonId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/menu-item-addons/bulk': {
        post: {
          tags: ['Menu-Item-Addons'],
          summary: 'Bulk attach addon to menu item',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateBulkMenuItemAddonRequest' }
              }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/menu-item-addons': {
        post: {
          tags: ['Menu-Item-Addons'],
          summary: 'Attach addon to menu item (optionally per menu item variant)',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateMenuItemAddonRequest' }
              }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            400: {
              description: 'Brand, outlet, item, addon or variant not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            409: {
              description: 'Duplicate mapping',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Menu-Item-Addons'],
          summary: 'List menu item addons',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'number', minimum: 1, maximum: 100, default: 20 }
            },
            { name: 'menuItemId', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'addonId', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'menuItemVariantId', in: 'query', required: false, schema: { type: 'string' } },
            {
              name: 'column',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['createdAt', 'updatedAt', 'isActive'],
                default: 'createdAt'
              }
            },
            {
              name: 'order',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'ASC' }
            }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Menu-Item-Addons'],
          summary: 'Update menu item addon allowed item IDs or status',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemAddonId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateMenuItemAddonRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        delete: {
          tags: ['Menu-Item-Addons'],
          summary: 'Delete menu item addon mapping',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemAddonId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/zones': {
        post: {
          tags: ['Zones'],
          summary: 'Create a new zone',
          description:
            'Mandatory headers: brand-id, outlet-id (set via Authorize). Requires ADMIN or OWNER role.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateZoneRequest' } }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            409: {
              description: 'Conflict',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Zones'],
          summary: 'List zones',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'page', in: 'query', required: false, schema: { type: 'number', default: 1 } },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'number', default: 20 }
            },
            { name: 'searchText', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'isActive', in: 'query', required: false, schema: { type: 'boolean' } },
            { name: 'column', in: 'query', required: false, schema: { type: 'string' } },
            {
              name: 'order',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['ASC', 'DESC'] }
            }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Zones'],
          summary: 'Update zone',
          description: 'Mandatory headers: brand-id, outlet-id. Requires ADMIN or OWNER role.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'zoneId', in: 'query', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateZoneRequest' } }
            }
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        delete: {
          tags: ['Zones'],
          summary: 'Delete zone',
          description: 'Mandatory headers: brand-id, outlet-id. Requires ADMIN or OWNER role.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'zoneId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/zones/detail': {
        get: {
          tags: ['Zones'],
          summary: 'Get zone detail',
          description: 'Mandatory headers: brand-id, outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'zoneId', in: 'query', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/zones/active': {
        get: {
          tags: ['Zones'],
          summary: 'List active zones (no pagination)',
          description:
            'Returns all zones where isDelete=false and isActive=true. Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
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
                            items: {
                              type: 'object',
                              properties: {
                                _id: { type: 'string' },
                                name: { type: 'string' }
                              },
                              required: ['_id', 'name']
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/tables/active': {
        get: {
          tags: ['Tables'],
          summary: 'List active tables',
          description: 'Mandatory headers: brand-id, outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/tables': {
        post: {
          tags: ['Tables'],
          summary: 'Create a new table',
          description: 'Mandatory headers: brand-id, outlet-id. Requires ADMIN or OWNER role.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateTableRequest' } }
            }
          },
          responses: {
            201: {
              description: 'Created',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Tables'],
          summary: 'List tables',
          description: 'Mandatory headers: brand-id, outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'page', in: 'query', required: false, schema: { type: 'number', default: 1 } },
            {
              name: 'limit',
              in: 'query',
              required: false,
              schema: { type: 'number', default: 20 }
            },
            { name: 'searchText', in: 'query', required: false, schema: { type: 'string' } },
            { name: 'isActive', in: 'query', required: false, schema: { type: 'boolean' } },
            { name: 'zoneId', in: 'query', required: false, schema: { type: 'string' } },
            {
              name: 'status',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'] }
            },
            { name: 'column', in: 'query', required: false, schema: { type: 'string' } },
            {
              name: 'order',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['ASC', 'DESC'] }
            }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        patch: {
          tags: ['Tables'],
          summary: 'Update table',
          description: 'Mandatory headers: brand-id, outlet-id. Requires ADMIN or OWNER role.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'tableId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdateTableRequest' } }
            }
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        delete: {
          tags: ['Tables'],
          summary: 'Delete table',
          description: 'Mandatory headers: brand-id, outlet-id. Requires ADMIN or OWNER role.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'tableId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/tables/detail': {
        get: {
          tags: ['Tables'],
          summary: 'Get table detail',
          description: 'Mandatory headers: brand-id, outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'tableId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/tables/status': {
        patch: {
          tags: ['Tables'],
          summary: 'Update table status',
          description:
            'Mandatory headers: brand-id, outlet-id. Update table status to AVAILABLE, OCCUPIED, or RESERVED.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'tableId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateTableStatusRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/menu/menu-item-addons/detail': {
        get: {
          tags: ['Menu-Item-Addons'],
          summary: 'Get menu item addon by id',
          description: 'Mandatory headers: brand-id, outlet-id (set via Authorize).',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'menuItemAddonId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/tables/live-orders': {
        get: {
          tags: ['Tables'],
          summary: 'Get live orders for a table',
          description: 'Mandatory headers: brand-id, outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'tableId', in: 'query', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/order': {
        post: {
          tags: ['Orders'],
          summary: 'Create a new order',
          description:
            'Creates an order with items, generates KOT automatically. Mandatory headers: brand-id, outlet-id. The waiterId is taken from the authenticated user token.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateOrderRequest' } }
            }
          },
          responses: {
            201: {
              description: 'Order created successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: { data: { $ref: '#/components/schemas/OrderDetail' } }
                      }
                    ]
                  }
                }
              }
            },
            400: {
              description: 'Validation error (missing tableId for DINE_IN, no items, etc.)',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            422: {
              description: 'Joi validation failed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        },
        get: {
          tags: ['Orders'],
          summary: 'List orders',
          description: 'Paginated order list with filters. Mandatory headers: brand-id, outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'number', minimum: 1, default: 1 } },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'number', minimum: 1, maximum: 100, default: 20 }
            },
            {
              name: 'status',
              in: 'query',
              schema: {
                type: 'number',
                enum: [1, 2, 3, 4],
                description: '1=OPEN, 2=IN_PROGRESS, 3=COMPLETED, 4=CANCELLED'
              }
            },
            {
              name: 'orderType',
              in: 'query',
              schema: {
                type: 'number',
                enum: [1, 2, 3],
                description: '1=DINE_IN, 2=TAKEAWAY, 3=DELIVERY'
              }
            },
            { name: 'tableId', in: 'query', schema: { type: 'string' } },
            { name: 'waiterId', in: 'query', schema: { type: 'string' } },
            { name: 'orderNumber', in: 'query', schema: { type: 'string' } },
            { name: 'fromDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'toDate', in: 'query', schema: { type: 'string', format: 'date' } }
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
                            items: { $ref: '#/components/schemas/OrderSummary' }
                          },
                          total: { type: 'number' }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/order/detail': {
        get: {
          tags: ['Orders'],
          summary: 'Get order detail',
          description:
            'Returns full order with items, addons, and populated waiter info. Mandatory headers: brand-id, outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'orderId', in: 'query', required: true, schema: { type: 'string' } }
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
                        properties: { data: { $ref: '#/components/schemas/OrderDetail' } }
                      }
                    ]
                  }
                }
              }
            },
            404: {
              description: 'Not Found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/order/add-items': {
        post: {
          tags: ['Orders'],
          summary: 'Add items to an existing order',
          description:
            'Adds new items to an OPEN or IN_PROGRESS order. Generates a new supplemental KOT. Does NOT replace existing items.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AddItemsToOrderRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Items added',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: { data: { $ref: '#/components/schemas/OrderDetail' } }
                      }
                    ]
                  }
                }
              }
            },
            404: {
              description: 'Order not found or not active',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/order/remove-item': {
        post: {
          tags: ['Orders'],
          summary: 'Cancel a specific item from an order',
          description:
            'Marks a single OrderItem as CANCELLED and generates a VOID KOT to signal the kitchen to stop preparing it. Recalculates order totals.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RemoveOrderItemRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Item cancelled',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: { data: { $ref: '#/components/schemas/OrderDetail' } }
                      }
                    ]
                  }
                }
              }
            },
            400: {
              description: 'Item already cancelled or served',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Item or order not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/order/update-item': {
        patch: {
          tags: ['Orders'],
          summary: 'Update a pending order item',
          description:
            'Change quantity or instruction on a PENDING item only (not yet sent to kitchen). At least one of quantity or instruction must be provided.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateOrderItemRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Item updated',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: { data: { $ref: '#/components/schemas/OrderDetail' } }
                      }
                    ]
                  }
                }
              }
            },
            400: {
              description: 'Cannot modify non-PENDING item',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/order/close': {
        post: {
          tags: ['Orders'],
          summary: 'Close (complete) an order',
          description:
            'Marks order as COMPLETED. Requires paymentStatus to be PAID or PARTIAL. Releases table if no other active orders.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CloseOrderRequest' } }
            }
          },
          responses: {
            200: {
              description: 'Order closed',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            400: {
              description: 'Order not in valid state or payment not recorded',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/order/cancel': {
        post: {
          tags: ['Orders'],
          summary: 'Cancel an order',
          description:
            'Cancels an OPEN or IN_PROGRESS order. Cancels all active KOTs. Releases table.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CancelOrderRequest' } }
            }
          },
          responses: {
            200: {
              description: 'Order cancelled',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            400: {
              description: 'Cannot cancel a completed order',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/order/tokens': {
        get: {
          tags: ['Orders'],
          summary: 'Token display (customer-facing board)',
          description: 'Returns all active TAKEAWAY orders split into preparing and ready lists.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          responses: {
            200: {
              description: 'Token display data',
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
                            properties: {
                              preparing: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/TokenDisplayItem' }
                              },
                              ready: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/TokenDisplayItem' }
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/tags': {
        get: {
          tags: ['Customer Tags'],
          summary: 'Get customer tags',
          description: 'Returns customer tags filtered by brand-id and outlet-id with search, active filter, and pagination.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'searchText', in: 'query', schema: { type: 'string' } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
            { name: 'page', in: 'query', schema: { type: 'number', minimum: 1, default: 1 } },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'number', minimum: 1, maximum: 100, default: 20 }
            },
            {
              name: 'column',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['name', 'discountType', 'discountValue', 'minOrderAmount', 'priority', 'isActive', 'createdAt', 'updatedAt'],
                default: 'createdAt'
              }
            },
            {
              name: 'order',
              in: 'query',
              schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
            }
          ],
          responses: {
            200: {
              description: 'Customer tags retrieved',
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
                            properties: {
                              data: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/CustomerTag' }
                              },
                              pagination: {
                                type: 'object',
                                properties: {
                                  total: { type: 'number' },
                                  page: { type: 'number' },
                                  limit: { type: 'number' }
                                }
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Customer Tags'],
          summary: 'Create customer tag',
          description: 'Creates a customer tag scoped to brand-id and outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCustomerTagRequest' }
              }
            }
          },
          responses: {
            201: {
              description: 'Customer tag created',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: { data: { $ref: '#/components/schemas/CustomerTag' } }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/tags/{id}': {
        get: {
          tags: ['Customer Tags'],
          summary: 'Get customer tag by id',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Customer tag retrieved',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: { data: { $ref: '#/components/schemas/CustomerTag' } }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        put: {
          tags: ['Customer Tags'],
          summary: 'Update customer tag',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateCustomerTagRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Customer tag updated',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: { data: { $ref: '#/components/schemas/CustomerTag' } }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        delete: {
          tags: ['Customer Tags'],
          summary: 'Soft delete customer tag',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Customer tag deleted',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: { data: { $ref: '#/components/schemas/CustomerTag' } }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/customers': {
        get: {
          tags: ['Customers'],
          summary: 'Get customers',
          description: 'Returns customers filtered by brand-id with searchText, tag filter, active filter, and pagination.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'searchText', in: 'query', schema: { type: 'string' } },
            { name: 'tagId', in: 'query', schema: { type: 'string' } },
            { name: 'isActive', in: 'query', schema: { type: 'boolean' } },
            { name: 'page', in: 'query', schema: { type: 'number', minimum: 1, default: 1 } },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'number', minimum: 1, maximum: 100, default: 20 }
            },
            {
              name: 'column',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['name', 'mobile', 'email', 'loyaltyPoints', 'totalSpent', 'totalOrders', 'lastVisitAt', 'creditBalance', 'isActive', 'createdAt', 'updatedAt'],
                default: 'createdAt'
              }
            },
            {
              name: 'order',
              in: 'query',
              schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' }
            }
          ],
          responses: {
            200: {
              description: 'Customers retrieved',
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
                            properties: {
                              data: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/Customer' }
                              },
                              pagination: {
                                type: 'object',
                                properties: {
                                  total: { type: 'number' },
                                  page: { type: 'number' },
                                  limit: { type: 'number' }
                                }
                              }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Customers'],
          summary: 'Create customer',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateCustomerRequest' }
              }
            }
          },
          responses: {
            201: {
              description: 'Customer created',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: { data: { $ref: '#/components/schemas/Customer' } }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/customers/{id}': {
        get: {
          tags: ['Customers'],
          summary: 'Get customer by id',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Customer retrieved',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } }
                    ]
                  }
                }
              }
            }
          }
        },
        put: {
          tags: ['Customers'],
          summary: 'Update customer',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateCustomerRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Customer updated',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } }
                    ]
                  }
                }
              }
            }
          }
        },
        delete: {
          tags: ['Customers'],
          summary: 'Soft delete customer',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'Customer deleted',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/customers/{id}/tags': {
        post: {
          tags: ['Customers'],
          summary: 'Assign tags to customer',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AssignCustomerTagsRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Tags assigned',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/customers/{id}/tags/{tagId}': {
        delete: {
          tags: ['Customers'],
          summary: 'Remove tag from customer',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'tagId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            200: {
              description: 'Tag removed',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      { type: 'object', properties: { data: { $ref: '#/components/schemas/Customer' } } }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/kot': {
        get: {
          tags: ['KOTs'],
          summary: 'List KOTs for a specific order',
          description:
            'Returns all KOTs (including VOID KOTs) for a given orderId. Mandatory headers: brand-id, outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'orderId', in: 'query', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'number', minimum: 1, default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'number', minimum: 1, default: 50 } }
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
                          data: { type: 'array', items: { $ref: '#/components/schemas/KOTDetail' } }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/kot/kitchen': {
        get: {
          tags: ['KOTs'],
          summary: 'Kitchen Display System (KDS) â€” all active KOTs',
          description:
            'Returns all non-completed KOTs for an outlet, sorted FIFO. Optionally filter by status. For Kitchen Display screens.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: {
                type: 'number',
                enum: [1, 2, 3],
                description: '1=PENDING, 2=PREPARING, 3=READY. Omit to get all active KOTs.'
              }
            }
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
                          data: { type: 'array', items: { $ref: '#/components/schemas/KOTDetail' } }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/kot/status': {
        patch: {
          tags: ['KOTs'],
          summary: 'Update KOT status',
          description: `Update KOT-level status. Enforces state machine:
- PENDING â†’ PREPARING or CANCELLED
- PREPARING â†’ READY or CANCELLED
- READY â†’ SERVED or CANCELLED
- Transitions outside these rules return HTTP 400.`,
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateKOTStatusRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'KOT status updated',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: { data: { $ref: '#/components/schemas/KOTDetail' } }
                      }
                    ]
                  }
                }
              }
            },
            400: {
              description: 'Invalid state transition',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'KOT not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
      '/api/v1/kot/item-status': {
        patch: {
          tags: ['KOTs'],
          summary: 'Update individual KOT item status',
          description:
            'Update status of a single item within a KOT (e.g., mark starter as SERVED while main is still PREPARING). Auto-advances KOT to SERVED when all items are served.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateKOTItemStatusRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'KOT item status updated',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'KOT does not belong to your outlet',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'KOT item not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },

      '/api/v1/report/sales': {
        get: {
          tags: ['Reports'],
          summary: 'Get Sales Report',
          description: 'Mandatory headers: brand-id, outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
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
                            items: { $ref: '#/components/schemas/SalesReportItem' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/report/item-sales': {
        get: {
          tags: ['Reports'],
          summary: 'Get Item Sales Report',
          description: 'Mandatory headers: brand-id, outlet-id.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
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
                            items: { $ref: '#/components/schemas/ItemSalesReportItem' }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },

      // ─── Payment ───────────────────────────────────────────────────────────────

      '/api/v1/payment/record': {
        post: {
          tags: ['Payments'],
          summary: 'Record a payment transaction',
          description:
            'Records a single payment transaction against an order. Supports partial payments — call multiple times until the full amount is settled. Atomically updates paidAmount and paymentStatus on the order. Requires brand-id and outlet-id headers.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RecordPaymentRequest' },
                examples: {
                  legacySinglePayment: {
                    summary: 'Single Payment (Legacy)',
                    value: {
                      orderId: '6627f1a2b3c4d5e6f7a8b9c0',
                      amount: 250.5,
                      paymentMethod: 3,
                      reference: 'UPI-TXN-987654321'
                    }
                  },
                  splitPayments: {
                    summary: 'Split Payments Array',
                    value: {
                      orderId: '6627f1a2b3c4d5e6f7a8b9c0',
                      payments: [
                        { amount: 100, paymentMethod: 1 },
                        { amount: 150.5, paymentMethod: 3, reference: 'UPI-TXN-1234' }
                      ]
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Payment recorded successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/RecordPaymentResponse' }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },

      '/api/v1/payment/order-payments': {
        get: {
          tags: ['Payments'],
          summary: 'Get all payments for an order',
          description:
            'Returns all individual payment transactions recorded against a specific order, along with running totals (totalAmount, paidAmount, balanceDue) and overall paymentStatus. Requires brand-id and outlet-id headers.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            {
              name: 'orderId',
              in: 'query',
              required: true,
              description: 'MongoDB ObjectId of the order',
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: {
              description: 'Order payment summary returned successfully',
              content: {
                'application/json': {
                  schema: {
                    allOf: [
                      { $ref: '#/components/schemas/ApiResponse' },
                      {
                        type: 'object',
                        properties: {
                          data: { $ref: '#/components/schemas/OrderPaymentSummary' }
                        }
                      }
                    ]
                  }
                }
              }
            },
            400: {
              description: 'Validation error — orderId is missing or invalid',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            401: {
              description: 'Unauthorized — missing or invalid bearer token',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden — user does not have access to the brand or outlet',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            404: {
              description: 'Order not found',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },

      '/api/v1/payment/list': {
        get: {
          tags: ['Payments'],
          summary: 'List all payment transactions (paginated)',
          description:
            'Returns a paginated list of payment transactions for the outlet. Supports optional filters by orderId, paymentMethod, and date range (fromDate / toDate). Results include the staff member who recorded the payment (name + role). Requires brand-id and outlet-id headers.',
          security: [{ bearerAuth: [], brandIdHeader: [], outletIdHeader: [] }],
          parameters: [
            {
              name: 'orderId',
              in: 'query',
              required: false,
              description: 'Filter by order ID (MongoDB ObjectId)',
              schema: { type: 'string' }
            },
            {
              name: 'paymentMethod',
              in: 'query',
              required: false,
              description: 'Filter by payment method: 1=CASH, 2=CARD, 3=UPI, 4=WALLET, 5=ONLINE',
              schema: { type: 'integer', enum: [1, 2, 3, 4, 5] }
            },
            {
              name: 'fromDate',
              in: 'query',
              required: false,
              description: 'Start of date range (ISO 8601 date-time)',
              schema: { type: 'string', format: 'date-time' }
            },
            {
              name: 'toDate',
              in: 'query',
              required: false,
              description: 'End of date range (ISO 8601 date-time)',
              schema: { type: 'string', format: 'date-time' }
            },
            {
              name: 'page',
              in: 'query',
              required: false,
              description: 'Page number (default: 1)',
              schema: { type: 'integer', minimum: 1, default: 1 }
            },
            {
              name: 'limit',
              in: 'query',
              required: false,
              description: 'Records per page, max 100 (default: 20)',
              schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
            }
          ],
          responses: {
            200: {
              description: 'Paginated payment list returned successfully',
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
                            items: { $ref: '#/components/schemas/Payment' }
                          },
                          total: {
                            type: 'number',
                            description: 'Total number of matching records'
                          }
                        }
                      }
                    ]
                  }
                }
              }
            },
            400: {
              description: 'Validation error in query parameters',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            401: {
              description: 'Unauthorized — missing or invalid bearer token',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            },
            403: {
              description: 'Forbidden — user does not have access to the brand or outlet',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } }
              }
            }
          }
        }
      },
    }
  };
  return spec;
};


