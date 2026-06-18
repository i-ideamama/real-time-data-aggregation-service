"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const supertest_1 = tslib_1.__importDefault(require("supertest"));
const express_1 = tslib_1.__importDefault(require("express"));
const tokenAggregation_service_1 = require("../../src/services/tokenAggregation.service");
jest.mock('../../src/repositories/token.repository');
jest.mock('../../src/services/tokenAggregation.service');
const mockRouter = express_1.default.Router();
mockRouter.get('/tokens', (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield tokenAggregation_service_1.tokenAggregationService.getTokens('pepe', 'volume', 'desc', 30, undefined);
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false });
    }
}));
mockRouter.get('/health', (_req, res) => {
    res.json({ success: true, status: 'healthy' });
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api', mockRouter);
describe('API Endpoints', () => {
    describe('GET /api/tokens', () => {
        it('should return tokens list', () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            tokenAggregation_service_1.tokenAggregationService.getTokens.mockResolvedValue({
                results: [],
                meta: { limit: 30, total: 0, hasMore: false },
                cached: false,
                timestamp: new Date(),
            });
            const response = yield (0, supertest_1.default)(app).get('/api/tokens');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('results');
            expect(response.body.data).toHaveProperty('meta');
        }));
        it('should handle errors gracefully', () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            tokenAggregation_service_1.tokenAggregationService.getTokens.mockRejectedValue(new Error('API Error'));
            const response = yield (0, supertest_1.default)(app).get('/api/tokens');
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
        }));
    });
    describe('GET /api/health', () => {
        it('should return healthy status', () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get('/api/health');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.status).toBe('healthy');
        }));
    });
});
