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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const redis_1 = require("redis");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Redis setup
// use a URL here when hosting
const redisClient = (0, redis_1.createClient)();
redisClient.on("error", (err) => console.error("Redis Client Error", err));
const DEFAULT_EXPIRATION = Number(process.env.REDIS_DEFAULT_EXPIRATION) || 60;
// some helpers
const toNum = (v) => (v == null ? null : Number(String(v).replace("%", "")) || null);
const lc = (s) => (s ? s.toLowerCase() : null);
const jupListFrom = (d) => { var _a, _b, _c; return (Array.isArray(d) ? d : (_c = (_b = (_a = d === null || d === void 0 ? void 0 : d.results) !== null && _a !== void 0 ? _a : d === null || d === void 0 ? void 0 : d.data) !== null && _b !== void 0 ? _b : d === null || d === void 0 ? void 0 : d.tokens) !== null && _c !== void 0 ? _c : []); };
const dexListFrom = (d) => { var _a, _b; return (Array.isArray(d) ? d : (_b = (_a = d === null || d === void 0 ? void 0 : d.pairs) !== null && _a !== void 0 ? _a : d === null || d === void 0 ? void 0 : d.results) !== null && _b !== void 0 ? _b : []); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// generic exponential-backoff wrapper
function withBackoff(fn_1) {
    return __awaiter(this, arguments, void 0, function* (fn, opts = {}) {
        const { maxRetries = 4, baseDelayMs = 200, maxDelayMs = 10000, factor = 2, jitter = true, retryOn = () => true, } = opts;
        let attempt = 0;
        let lastErr = null;
        while (attempt <= maxRetries) {
            try {
                return yield fn();
            }
            catch (err) {
                lastErr = err;
                if (!retryOn(err))
                    throw err;
                if (attempt === maxRetries)
                    break;
                // compute exponential delay
                let delay = baseDelayMs * Math.pow(factor, attempt);
                if (delay > maxDelayMs)
                    delay = maxDelayMs;
                // random jitter
                if (jitter) {
                    const jitterFactor = 0.25;
                    const rnd = (Math.random() - 0.5) * 2 * jitterFactor; // -j..+j
                    delay = Math.max(0, Math.round(delay * (1 + rnd)));
                }
                // wait then retry
                yield sleep(delay);
                attempt++;
            }
        }
        // retries exhausted
        throw lastErr;
    });
}
// MAIN LOGIC :
// fetch all pages from Jupiter with cursor pagination
function fetchAllJupPages(query) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        let url = `https://lite-api.jup.ag/tokens/v2/search?query=${encodeURIComponent(query)}`;
        const all = [];
        while (url) {
            const res = yield withBackoff(() => axios_1.default.get(url), {
                maxRetries: 5,
                baseDelayMs: 150,
                factor: 2,
                maxDelayMs: 5000,
                jitter: true,
                retryOn: (err) => {
                    var _a;
                    // retry on specific network errors
                    const status = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status;
                    if (!status)
                        return true;
                    if (status === 429)
                        return true;
                    if (status >= 500)
                        return true;
                    return false;
                },
            });
            const data = res.data;
            if (Array.isArray(data.results))
                all.push(...data.results);
            url = (_a = data.next_url) !== null && _a !== void 0 ? _a : null;
        }
        return all;
    });
}
// merge one coin's jupList + dexList
function mergeLists(jList, dList, solUsd) {
    const map = new Map();
    const addDex = (p) => {
        var _a, _b, _c, _d, _e, _f;
        const addr = lc((_a = p === null || p === void 0 ? void 0 : p.baseToken) === null || _a === void 0 ? void 0 : _a.address) || lc(p === null || p === void 0 ? void 0 : p.pairAddress) || null;
        const sym = (_d = (_c = (_b = p === null || p === void 0 ? void 0 : p.baseToken) === null || _b === void 0 ? void 0 : _b.symbol) === null || _c === void 0 ? void 0 : _c.toString().toUpperCase()) !== null && _d !== void 0 ? _d : null;
        const key = addr !== null && addr !== void 0 ? addr : sym;
        if (!key)
            return;
        const cur = (_e = map.get(key)) !== null && _e !== void 0 ? _e : {};
        cur.d = (_f = cur.d) !== null && _f !== void 0 ? _f : p;
        map.set(key, cur);
    };
    const addJup = (t) => {
        var _a, _b, _c, _d, _e, _f;
        const addr = (_b = (_a = lc(t === null || t === void 0 ? void 0 : t.id)) !== null && _a !== void 0 ? _a : lc(t === null || t === void 0 ? void 0 : t.tokenProgram)) !== null && _b !== void 0 ? _b : null;
        const sym = (_d = (_c = t === null || t === void 0 ? void 0 : t.symbol) === null || _c === void 0 ? void 0 : _c.toString().toUpperCase()) !== null && _d !== void 0 ? _d : null;
        const key = addr !== null && addr !== void 0 ? addr : sym;
        if (!key)
            return;
        const cur = (_e = map.get(key)) !== null && _e !== void 0 ? _e : {};
        cur.j = (_f = cur.j) !== null && _f !== void 0 ? _f : t;
        map.set(key, cur);
    };
    (dList || []).forEach(addDex);
    (jList || []).forEach(addJup);
    const results = Array.from(map.entries()).map(([key, pair]) => {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42;
        const j = (_a = pair.j) !== null && _a !== void 0 ? _a : {};
        const p = (_b = pair.d) !== null && _b !== void 0 ? _b : {};
        const token_address = (_h = (_g = (_f = (_d = (_c = lc(j === null || j === void 0 ? void 0 : j.id)) !== null && _c !== void 0 ? _c : lc(j === null || j === void 0 ? void 0 : j.tokenProgram)) !== null && _d !== void 0 ? _d : lc((_e = p === null || p === void 0 ? void 0 : p.baseToken) === null || _e === void 0 ? void 0 : _e.address)) !== null && _f !== void 0 ? _f : lc(p === null || p === void 0 ? void 0 : p.pairAddress)) !== null && _g !== void 0 ? _g : key) !== null && _h !== void 0 ? _h : null;
        const token_name = (_p = (_m = (_k = (_j = j === null || j === void 0 ? void 0 : j.name) !== null && _j !== void 0 ? _j : j === null || j === void 0 ? void 0 : j.token_name) !== null && _k !== void 0 ? _k : (_l = p === null || p === void 0 ? void 0 : p.baseToken) === null || _l === void 0 ? void 0 : _l.name) !== null && _m !== void 0 ? _m : (_o = p === null || p === void 0 ? void 0 : p.baseToken) === null || _o === void 0 ? void 0 : _o.title) !== null && _p !== void 0 ? _p : null;
        const token_ticker = (_u = (_t = ((_s = (_q = j === null || j === void 0 ? void 0 : j.symbol) !== null && _q !== void 0 ? _q : (_r = p === null || p === void 0 ? void 0 : p.baseToken) === null || _r === void 0 ? void 0 : _r.symbol) !== null && _s !== void 0 ? _s : key)) === null || _t === void 0 ? void 0 : _t.toString()) !== null && _u !== void 0 ? _u : null;
        const usdPrice = toNum((_x = (_w = (_v = j === null || j === void 0 ? void 0 : j.usdPrice) !== null && _v !== void 0 ? _v : j === null || j === void 0 ? void 0 : j.priceUsd) !== null && _w !== void 0 ? _w : p === null || p === void 0 ? void 0 : p.priceUsd) !== null && _x !== void 0 ? _x : (_y = p === null || p === void 0 ? void 0 : p.baseToken) === null || _y === void 0 ? void 0 : _y.priceUsd);
        const explicitPriceSol = toNum((_1 = (_0 = (_z = j === null || j === void 0 ? void 0 : j.price_sol) !== null && _z !== void 0 ? _z : j === null || j === void 0 ? void 0 : j.priceSol) !== null && _0 !== void 0 ? _0 : p === null || p === void 0 ? void 0 : p.priceNative) !== null && _1 !== void 0 ? _1 : null);
        const price_sol = explicitPriceSol !== null && explicitPriceSol !== void 0 ? explicitPriceSol : (usdPrice && solUsd ? Number(usdPrice / solUsd) : null);
        const marketUsd = (_4 = toNum((_3 = (_2 = j === null || j === void 0 ? void 0 : j.mcap) !== null && _2 !== void 0 ? _2 : j === null || j === void 0 ? void 0 : j.mcapUsd) !== null && _3 !== void 0 ? _3 : j === null || j === void 0 ? void 0 : j.mcap)) !== null && _4 !== void 0 ? _4 : toNum((_6 = (_5 = p === null || p === void 0 ? void 0 : p.marketCap) !== null && _5 !== void 0 ? _5 : p === null || p === void 0 ? void 0 : p.fdv) !== null && _6 !== void 0 ? _6 : null);
        const market_cap_sol = marketUsd && solUsd ? Number(marketUsd / solUsd) : null;
        const jBuy = toNum((_9 = (_8 = (_7 = j === null || j === void 0 ? void 0 : j.stats24h) === null || _7 === void 0 ? void 0 : _7.buyVolume) !== null && _8 !== void 0 ? _8 : j === null || j === void 0 ? void 0 : j.buyVolume) !== null && _9 !== void 0 ? _9 : (_10 = j === null || j === void 0 ? void 0 : j.stats24h) === null || _10 === void 0 ? void 0 : _10.buyVolume);
        const jSell = toNum((_13 = (_12 = (_11 = j === null || j === void 0 ? void 0 : j.stats24h) === null || _11 === void 0 ? void 0 : _11.sellVolume) !== null && _12 !== void 0 ? _12 : j === null || j === void 0 ? void 0 : j.sellVolume) !== null && _13 !== void 0 ? _13 : (_14 = j === null || j === void 0 ? void 0 : j.stats24h) === null || _14 === void 0 ? void 0 : _14.sellVolume);
        const jVol = (jBuy || 0) + (jSell || 0) || null;
        const dexVol = toNum((_17 = (_16 = (_15 = p === null || p === void 0 ? void 0 : p.volume) === null || _15 === void 0 ? void 0 : _15.h24) !== null && _16 !== void 0 ? _16 : p === null || p === void 0 ? void 0 : p.volume_h24) !== null && _17 !== void 0 ? _17 : p === null || p === void 0 ? void 0 : p.volume);
        const volUsd = jVol !== null && jVol !== void 0 ? jVol : dexVol;
        const volume_sol = volUsd && solUsd ? Number(volUsd / solUsd) : null;
        const liqUsd = toNum((_22 = (_21 = (_19 = (_18 = j === null || j === void 0 ? void 0 : j.liquidity) !== null && _18 !== void 0 ? _18 : j === null || j === void 0 ? void 0 : j.liquidityUsd) !== null && _19 !== void 0 ? _19 : (_20 = p === null || p === void 0 ? void 0 : p.liquidity) === null || _20 === void 0 ? void 0 : _20.usd) !== null && _21 !== void 0 ? _21 : p === null || p === void 0 ? void 0 : p.liquidity) !== null && _22 !== void 0 ? _22 : null);
        const liquidity_sol = liqUsd && solUsd ? Number(liqUsd / solUsd) : null;
        const txJ = toNum((_25 = (_24 = (_23 = j === null || j === void 0 ? void 0 : j.stats24h) === null || _23 === void 0 ? void 0 : _23.numTraders) !== null && _24 !== void 0 ? _24 : j === null || j === void 0 ? void 0 : j.numTraders) !== null && _25 !== void 0 ? _25 : j === null || j === void 0 ? void 0 : j.holderCount);
        const txDex = ((toNum((_27 = (_26 = p === null || p === void 0 ? void 0 : p.txns) === null || _26 === void 0 ? void 0 : _26.h24) === null || _27 === void 0 ? void 0 : _27.buys) || 0) + (toNum((_29 = (_28 = p === null || p === void 0 ? void 0 : p.txns) === null || _28 === void 0 ? void 0 : _28.h24) === null || _29 === void 0 ? void 0 : _29.sells) || 0)) || null;
        const transaction_count = (_30 = txJ !== null && txJ !== void 0 ? txJ : txDex) !== null && _30 !== void 0 ? _30 : null;
        const price_1hr_change = toNum((_37 = (_35 = (_33 = (_32 = (_31 = j === null || j === void 0 ? void 0 : j.stats1h) === null || _31 === void 0 ? void 0 : _31.priceChange) !== null && _32 !== void 0 ? _32 : j === null || j === void 0 ? void 0 : j.priceChange) !== null && _33 !== void 0 ? _33 : (_34 = p === null || p === void 0 ? void 0 : p.priceChange) === null || _34 === void 0 ? void 0 : _34.h1) !== null && _35 !== void 0 ? _35 : (_36 = p === null || p === void 0 ? void 0 : p.priceChange) === null || _36 === void 0 ? void 0 : _36.h1) !== null && _37 !== void 0 ? _37 : null);
        const protocol = (_41 = (_40 = (_39 = (_38 = j === null || j === void 0 ? void 0 : j.launchpad) !== null && _38 !== void 0 ? _38 : j === null || j === void 0 ? void 0 : j.protocol) !== null && _39 !== void 0 ? _39 : p === null || p === void 0 ? void 0 : p.dexId) !== null && _40 !== void 0 ? _40 : p === null || p === void 0 ? void 0 : p.dex) !== null && _41 !== void 0 ? _41 : null;
        return {
            token_address,
            token_name: (_42 = token_name !== null && token_name !== void 0 ? token_name : token_ticker) !== null && _42 !== void 0 ? _42 : "unknown",
            token_ticker,
            price_sol,
            market_cap_sol,
            volume_sol,
            liquidity_sol,
            transaction_count,
            price_1hr_change,
            protocol,
        };
    });
    return results;
}
function processCoin(query, solUsdFallback) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        try {
            const [jList, dexResp] = yield Promise.all([
                fetchAllJupPages(query),
                // Dexscreener with backoff and same retry policy
                withBackoff(() => axios_1.default
                    .get(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`)
                    .then((r) => r.data), {
                    maxRetries: 4,
                    baseDelayMs: 200,
                    factor: 2,
                    maxDelayMs: 5000,
                    jitter: true,
                    retryOn: (err) => {
                        var _a;
                        const status = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status;
                        if (!status)
                            return true;
                        if (status === 429)
                            return true;
                        if (status >= 500)
                            return true;
                        return false;
                    },
                }).catch(() => null),
            ]);
            const dList = dexListFrom(dexResp);
            // try to find SOL price in this dex response (helps when coin query returns SOL pairs)
            let solUsdLocal = null;
            for (const p of dList || []) {
                const baseSym = (_b = (_a = p === null || p === void 0 ? void 0 : p.baseToken) === null || _a === void 0 ? void 0 : _a.symbol) === null || _b === void 0 ? void 0 : _b.toString().toUpperCase();
                const priceUsd = toNum(p === null || p === void 0 ? void 0 : p.priceUsd);
                if (baseSym === "SOL" && priceUsd) {
                    solUsdLocal = priceUsd;
                    break;
                }
            }
            const solUsd = solUsdLocal !== null && solUsdLocal !== void 0 ? solUsdLocal : solUsdFallback;
            const merged = mergeLists(jList, dList, solUsd);
            return { query, merged, counts: { jup: jList.length, dex: dList.length } };
        }
        catch (err) {
            console.error(`error processing ${query}:`, err);
            return { query, merged: [], counts: { jup: 0, dex: 0 }, error: (_c = err === null || err === void 0 ? void 0 : err.message) !== null && _c !== void 0 ? _c : String(err) };
        }
    });
}
const checkAPI = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const coins = ["bonk", "dogecoin"];
    try {
        if (!redisClient.isOpen) {
            yield redisClient.connect();
        }
        const cacheKey = `merged:${coins.join(",")}`;
        try {
            const cached = yield redisClient.get(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                return res.status(200).json(Object.assign({ fromCache: true }, parsed));
            }
        }
        catch (rcErr) {
            console.error("Redis GET error:", rcErr);
        }
        const cgResp = yield withBackoff(() => axios_1.default.get("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"), {
            maxRetries: 4,
            baseDelayMs: 200,
            factor: 2,
            maxDelayMs: 5000,
            jitter: true,
            retryOn: (err) => {
                var _a;
                const status = (_a = err === null || err === void 0 ? void 0 : err.response) === null || _a === void 0 ? void 0 : _a.status;
                if (!status)
                    return true;
                if (status === 429)
                    return true;
                if (status >= 500)
                    return true;
                return false;
            },
        }).catch(() => null);
        const solUsdFallback = (_f = toNum((_c = (_b = (_a = cgResp === null || cgResp === void 0 ? void 0 : cgResp.data) === null || _a === void 0 ? void 0 : _a.solana) === null || _b === void 0 ? void 0 : _b.usd) !== null && _c !== void 0 ? _c : (_e = (_d = cgResp === null || cgResp === void 0 ? void 0 : cgResp.data) === null || _d === void 0 ? void 0 : _d.sol) === null || _e === void 0 ? void 0 : _e.usd)) !== null && _f !== void 0 ? _f : null;
        const settled = yield Promise.allSettled(coins.map((c) => processCoin(c, solUsdFallback)));
        const aggregated = [];
        const perCoinSummary = [];
        for (const s of settled) {
            if (s.status === "fulfilled") {
                const { query, merged, counts, error } = s.value;
                perCoinSummary.push({ query, merged_count: merged.length, counts, error });
                aggregated.push(...merged.map((item) => (Object.assign(Object.assign({}, item), { _query: query }))));
            }
            else {
                perCoinSummary.push({ query: "unknown", merged_count: 0, error: (_h = (_g = s.reason) === null || _g === void 0 ? void 0 : _g.message) !== null && _h !== void 0 ? _h : String(s.reason) });
            }
        }
        const payload = {
            coins,
            sol_price_usd_hint: solUsdFallback,
            total_merged: aggregated.length,
            per_coin: perCoinSummary,
            results: aggregated,
        };
        try {
            yield redisClient.setEx(cacheKey, DEFAULT_EXPIRATION, JSON.stringify(payload));
        }
        catch (rcErr) {
            console.error("Redis SETEX error:", rcErr);
        }
        return res.status(200).json(payload);
    }
    catch (err) {
        console.error("overall error:", err);
        return res.status(500).json({ message: "internal error", error: (_j = err === null || err === void 0 ? void 0 : err.message) !== null && _j !== void 0 ? _j : String(err) });
    }
});
exports.checkAPI = checkAPI;
