import { z } from 'zod';
import { insertUserSchema, insertListingSchema, insertInquirySchema, insertPurchaseSchema, users, listings, inquiries, purchases } from './schema';

export * from './schema';

// === ERROR SCHEMAS ===
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// === API CONTRACT ===
export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  listings: {
    list: {
      method: 'GET' as const,
      path: '/api/listings',
      input: z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof listings.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/listings/:id',
      responses: {
        200: z.custom<typeof listings.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/listings',
      input: insertListingSchema,
      responses: {
        201: z.custom<typeof listings.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/listings/:id',
      input: insertListingSchema.partial(),
      responses: {
        200: z.custom<typeof listings.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/listings/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  ai: {
    identify: {
      method: 'POST' as const,
      path: '/api/identify-waste',
      input: z.object({
        image: z.string(), // base64
      }),
      responses: {
        200: z.object({
          material: z.string(),
          category: z.string(),
          confidence: z.number(),
          description: z.string(),
        }),
        500: errorSchemas.internal,
      },
    },
  },
  inquiries: {
    create: {
      method: 'POST' as const,
      path: '/api/inquiries',
      input: insertInquirySchema,
      responses: {
        201: z.custom<typeof inquiries.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  purchases: {
    create: {
      method: 'POST' as const,
      path: '/api/purchases',
      input: z.object({
        listingId: z.number(),
        quantity: z.number().positive(),
      }),
      responses: {
        201: z.custom<typeof purchases.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    myPurchases: {
      method: 'GET' as const,
      path: '/api/purchases/my',
      responses: {
        200: z.array(z.custom<typeof purchases.$inferSelect>()),
      },
    },
    mySales: {
      method: 'GET' as const,
      path: '/api/purchases/sales',
      responses: {
        200: z.array(z.custom<typeof purchases.$inferSelect>()),
      },
    },
    updateStatus: {
      method: 'PUT' as const,
      path: '/api/purchases/:id/status',
      input: z.object({ status: z.enum(["PENDING", "ACCEPTED", "REJECTED"]) }),
      responses: {
        200: z.custom<typeof purchases.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
