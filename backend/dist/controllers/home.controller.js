"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomePage = void 0;
const tslib_1 = require("tslib");
const tokenAggregation_service_1 = require("../services/tokenAggregation.service");
const logger_1 = require("../config/logger");
const socket_1 = require("../config/socket");
const getHomePage = (req, res) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const { query = 'pepe' } = req.query;
        const result = yield tokenAggregation_service_1.tokenAggregationService.aggregateTokens(String(query));
        try {
            const io = (0, socket_1.getIO)();
            if (io) {
                io.emit('home:update', result);
            }
        }
        catch (error) {
            logger_1.logger.error('Socket emit error', error);
        }
        res.status(200).json({
            success: true,
            data: result,
            requestId: req.id,
        });
    }
    catch (error) {
        logger_1.logger.error('Home page error', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch home page data',
            requestId: req.id,
        });
    }
});
exports.getHomePage = getHomePage;
