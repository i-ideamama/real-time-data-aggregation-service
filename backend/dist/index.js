"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const cors_1 = tslib_1.__importDefault(require("cors"));
const compression_1 = tslib_1.__importDefault(require("compression"));
const express_rate_limit_1 = tslib_1.__importDefault(require("express-rate-limit"));
const http_1 = tslib_1.__importDefault(require("http"));
const env_1 = require("./config/env");
const redis_1 = require("./config/redis");
const logger_1 = require("./config/logger");
const socket_1 = require("./config/socket");
const requestId_1 = require("./middleware/requestId");
const errorHandler_1 = require("./middleware/errorHandler");
const tokenRefresh_job_1 = require("./jobs/tokenRefresh.job");
const getHome_route_1 = tslib_1.__importDefault(require("./routes/getHome.route"));
const api_routes_1 = tslib_1.__importDefault(require("./routes/api.routes"));
const rawPort = process.env.PORT;
const PORT = rawPort ? Number(rawPort) : 3000;
const app = (0, express_1.default)();
const limiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.config.rateLimit.windowMs,
    max: env_1.config.rateLimit.max,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use((0, cors_1.default)({ origin: env_1.config.cors.origin }));
app.use((0, compression_1.default)());
app.use(express_1.default.json());
app.use(limiter);
app.use(requestId_1.requestIdMiddleware);
app.use('/home', getHome_route_1.default);
app.use('/api', api_routes_1.default);
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        service: 'real-time-crypto-aggregator',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            tokens: '/api/tokens',
            metrics: '/api/metrics',
            home: '/home/page',
        },
    });
});
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Not found',
        requestId: req.id,
    });
});
app.use(errorHandler_1.errorHandler);
const server = http_1.default.createServer(app);
(0, socket_1.initSocket)(server);
function start() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, redis_1.initRedis)().catch((err) => {
                logger_1.logger.warn('Redis initialization failed, continuing without cache:', err.message);
            });
            yield (0, tokenRefresh_job_1.scheduleTokenRefresh)().catch((err) => {
                logger_1.logger.warn('Failed to schedule background jobs:', err.message);
            });
            server.listen(env_1.config.port, () => {
                logger_1.logger.info(`Server listening on port ${env_1.config.port}`);
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to start server', error);
            process.exit(1);
        }
    });
}
function shutdown() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        logger_1.logger.info('Shutting down gracefully...');
        try {
            yield (0, tokenRefresh_job_1.closeQueue)();
            yield (0, redis_1.closeRedis)();
            server.close(() => {
                logger_1.logger.info('Server closed');
                process.exit(0);
            });
            setTimeout(() => {
                logger_1.logger.error('Forced shutdown');
                process.exit(1);
            }, 10000);
        }
        catch (error) {
            logger_1.logger.error('Error during shutdown', error);
            process.exit(1);
        }
    });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
start();
