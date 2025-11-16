"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const httpClient_1 = require("../../src/utils/httpClient");
const AppError_1 = require("../../src/errors/AppError");
jest.mock('axios');
describe('withRetry', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should succeed on first attempt', () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const fn = jest.fn().mockResolvedValue({ data: 'success' });
        const result = yield (0, httpClient_1.withRetry)(fn);
        expect(result).toEqual({ data: 'success' });
        expect(fn).toHaveBeenCalledTimes(1);
    }));
    it('should retry on failure and eventually succeed', () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const fn = jest
            .fn()
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ data: 'success' });
        const result = yield (0, httpClient_1.withRetry)(fn);
        expect(result).toEqual({ data: 'success' });
        expect(fn).toHaveBeenCalledTimes(2);
    }));
    it('should throw after max retries', () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const fn = jest.fn().mockRejectedValue(new Error('Network error'));
        yield expect((0, httpClient_1.withRetry)(fn)).rejects.toThrow(AppError_1.ServiceUnavailableError);
    }));
    it('should handle 429 rate limit errors', () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const error = new Error('Rate limited');
        error.response = {
            status: 429,
            headers: { 'retry-after': '1' },
        };
        const fn = jest
            .fn()
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce({ data: 'success' });
        const result = yield (0, httpClient_1.withRetry)(fn);
        expect(result).toEqual({ data: 'success' });
    }));
});
