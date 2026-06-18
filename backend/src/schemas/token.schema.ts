import { z } from 'zod';

export const TokenQuerySchema = z.object({
  period: z.enum(['1h', '24h', '7d']).default('24h'),
  sortBy: z.enum(['volume', 'priceChange', 'marketCap', 'liquidity']).default('volume'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  cursor: z.string().optional(),
});

export const TokenAddressParamSchema = z.object({
  address: z.string().min(1),
});

export type TokenQueryParams = z.infer<typeof TokenQuerySchema>;
export type TokenAddressParam = z.infer<typeof TokenAddressParamSchema>;
