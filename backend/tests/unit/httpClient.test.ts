import { httpClient, withRetry } from '../../src/utils/httpClient';
import { ServiceUnavailableError } from '../../src/errors/AppError';

jest.mock('axios');

describe('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should succeed on first attempt', async () => {
    const fn = jest.fn().mockResolvedValue({ data: 'success' });
    const result = await withRetry(fn);

    expect(result).toEqual({ data: 'success' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: 'success' });

    const result = await withRetry(fn);

    expect(result).toEqual({ data: 'success' });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(withRetry(fn)).rejects.toThrow(ServiceUnavailableError);
  });

  it('should handle 429 rate limit errors', async () => {
    const error = new Error('Rate limited');
    (error as any).response = {
      status: 429,
      headers: { 'retry-after': '1' },
    };

    const fn = jest
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ data: 'success' });

    const result = await withRetry(fn);

    expect(result).toEqual({ data: 'success' });
  });
});
