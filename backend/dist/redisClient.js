"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("redis");
const REDIS_URL = (_a = process.env.REDIS_URL) !== null && _a !== void 0 ? _a : 'redis://127.0.0.1:6379';
exports.redisClient = (0, redis_1.createClient)({ url: REDIS_URL });
exports.redisClient.on('error', (err) => console.error('Redis Client Error', err));
// try to connect immediately
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!exports.redisClient.isOpen)
            yield exports.redisClient.connect();
        console.log('[redis] connected');
    }
    catch (e) {
        console.error('[redis] connect error', e);
    }
}))();
exports.default = exports.redisClient;
