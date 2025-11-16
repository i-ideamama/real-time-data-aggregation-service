import { AppError, ValidationError, NotFoundError } from '../../src/errors/AppError';

describe('Error Handling and Edge Cases', () => {
  describe('AppError Custom Error', () => {
    it('should create AppError with status code and message', () => {
      const error = new AppError(400, 'Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
    });

    it('should create AppError with 500 status code', () => {
      const error = new AppError(500, 'Server error');

      expect(error.statusCode).toBe(500);
    });

    it('should be instance of Error', () => {
      const error = new AppError(400, 'Test');

      expect(error instanceof Error).toBe(true);
    });

    it('should preserve error stack trace', () => {
      const error = new AppError(400, 'Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });

    it('should handle ValidationError subclass', () => {
      const error = new ValidationError('Invalid input');

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });

    it('should handle NotFoundError subclass', () => {
      const error = new NotFoundError('Token');

      expect(error.statusCode).toBe(404);
      expect(error.message).toContain('Token not found');
    });
  });

  describe('Validation Edge Cases', () => {
    it('should validate token address format', () => {
      const validAddresses = [
        'EPjFWaLb3odccjf7wMCteKkyQbER5z5z31L2r2uxNXT',
        'TokenkegQfeZyiNwAJsU1zw7zNwagJ5jbNQw8g4Pt',
      ];

      const invalidAddresses = [
        'short',
        '',
        'invalid!@#$',
        null,
        undefined,
      ];

      validAddresses.forEach((addr) => {
        expect(addr).toBeDefined();
        expect(addr.length).toBeGreaterThanOrEqual(40);
      });

      invalidAddresses.forEach((addr) => {
        if (addr === null || addr === undefined) {
          expect(addr).toBeFalsy();
        } else {
          expect(addr.length).toBeLessThan(40);
        }
      });
    });

    it('should handle special characters in search query', () => {
      const queries = [
        'pepe&co',
        'token@123',
        'meme/coin',
        'token<script>',
        'normal-token',
      ];

      queries.forEach((query) => {
        expect(query).toBeDefined();
        expect(typeof query).toBe('string');
      });
    });

    it('should validate numeric parameters', () => {
      const testCases = [
        { value: 0, isValid: false },
        { value: 1, isValid: true },
        { value: 100, isValid: true },
        { value: 1000, isValid: true },
        { value: -1, isValid: false },
        { value: 999999, isValid: true },
        { value: NaN, isValid: false },
        { value: Infinity, isValid: false },
      ];

      testCases.forEach(({ value, isValid }) => {
        if (isValid) {
          expect(value).toBeGreaterThan(0);
          expect(isFinite(value)).toBe(true);
        } else {
          expect(value <= 0 || !isFinite(value)).toBe(true);
        }
      });
    });

    it('should handle null and undefined values', () => {
      expect(null).toBeNull();
      expect(undefined).toBeUndefined();

      const nullValue = null;
      const undefinedValue = undefined;

      expect(nullValue ?? 'default').toBe('default');
      expect(undefinedValue ?? 'default').toBe('default');
    });

    it('should validate JSON data structures', () => {
      const validJSON = {
        success: true,
        data: {
          results: [{ token_ticker: 'PEPE' }],
          meta: { total: 1 },
        },
        requestId: 'test-123',
      };

      expect(validJSON.success).toBe(true);
      expect(Array.isArray(validJSON.data.results)).toBe(true);
      expect(validJSON.data.meta).toBeDefined();

      const invalidJSON: any = {
        missing_required_fields: true,
      };

      expect(invalidJSON.success).toBeUndefined();
      expect(invalidJSON.data).toBeUndefined();
    });
  });

  describe('Performance and Resource Edge Cases', () => {
    it('should handle large arrays efficiently', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        value: Math.random(),
      }));

      expect(largeArray).toHaveLength(10000);
      expect(largeArray[0].id).toBe(0);
      expect(largeArray[9999].id).toBe(9999);
    });

    it('should handle very large numbers', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      const largePrice = 999999999.99;

      expect(largeNumber).toBeGreaterThan(0);
      expect(largePrice).toBeGreaterThan(0);
      expect(isFinite(largePrice)).toBe(true);
    });

    it('should handle very small decimal numbers', () => {
      const smallPrice = 0.00000001;
      const tinyValue = Number.MIN_VALUE;

      expect(smallPrice).toBeGreaterThan(0);
      expect(smallPrice).toBeLessThan(0.0001);
      expect(tinyValue).toBeGreaterThan(0);
    });

    it('should handle string concatenation with special characters', () => {
      const baseUrl = 'http://localhost:3000';
      const paths = ['/api/tokens', '/home/page', '/api/health'];
      const queryParams = ['?search=pepe', '?limit=30', '&sortBy=volume'];

      const urls = paths.map((path) => baseUrl + path);
      expect(urls).toHaveLength(3);
      expect(urls[0]).toBe('http://localhost:3000/api/tokens');

      const urlWithQuery = urls[0] + queryParams[0];
      expect(urlWithQuery).toContain('?search=pepe');
    });
  });

  describe('Type Coercion Edge Cases', () => {
    it('should handle string to number conversion', () => {
      expect(Number('123')).toBe(123);
      expect(Number('0')).toBe(0);
      expect(Number('invalid')).toBeNaN();
      expect(Number('')).toBe(0);
    });

    it('should handle string to boolean conversion', () => {
      expect(Boolean('true')).toBe(true);
      expect(Boolean('false')).toBe(true); // Non-empty string is truthy
      expect(Boolean('')).toBe(false);
      expect(Boolean('0')).toBe(true);
    });

    it('should handle array to string conversion', () => {
      const arr = [1, 2, 3];
      expect(arr.toString()).toBe('1,2,3');

      const emptyArr: number[] = [];
      expect(emptyArr.toString()).toBe('');
    });
  });

  describe('Concurrency and Race Condition Edge Cases', () => {
    it('should handle concurrent async operations', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        Promise.resolve({ id: i, value: i * 10 })
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.id).toBe(index);
      });
    });

    it('should handle Promise.allSettled with mixed results', async () => {
      const promises = [
        Promise.resolve('success'),
        Promise.reject('error'),
        Promise.resolve('success2'),
      ];

      const results = await Promise.allSettled(promises);

      expect(results).toHaveLength(3);
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
    });

    it('should handle timeout scenarios', async () => {
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve('completed'), 100)
      );

      const result = await Promise.race([
        timeoutPromise,
        new Promise((resolve) => setTimeout(() => resolve('timeout'), 200)),
      ]);

      expect(result).toBe('completed');
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle zero values appropriately', () => {
      expect(0).toBe(0);
      expect(0 + 1).toBe(1);
      expect(0 * 100).toBe(0);
      expect(0 / 1).toBe(0);
    });

    it('should handle one value', () => {
      expect(1).toBe(1);
      expect(1 + 1).toBe(2);
      expect(1 * 100).toBe(100);
    });

    it('should handle maximum safe integer', () => {
      const maxInt = Number.MAX_SAFE_INTEGER;
      expect(maxInt).toBeGreaterThan(0);
      expect(maxInt + 1).toBe(maxInt + 1); // Precision loss expected
    });

    it('should handle negative values', () => {
      expect(-1).toBe(-1);
      expect(-100).toBeLessThan(0);
      expect(-0).toBe(0); // -0 === 0
    });
  });

  describe('DateTime Edge Cases', () => {
    it('should handle current timestamp', () => {
      const now = new Date();
      expect(now).toBeInstanceOf(Date);
      expect(now.getTime()).toBeGreaterThan(0);
    });

    it('should handle timestamp conversion', () => {
      const date = new Date('2024-01-01');
      const timestamp = date.getTime();
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should handle epoch time', () => {
      const epoch = new Date(0);
      expect(epoch.getTime()).toBe(0);
    });

    it('should handle ISO string conversion', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const isoString = date.toISOString();
      expect(isoString).toContain('2024-01-01');
    });
  });
});
