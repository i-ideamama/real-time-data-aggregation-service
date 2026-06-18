"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = tslib_1.__importDefault(require("express"));
const home_controller_1 = require("../controllers/home.controller");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
router.get('/page', (0, errorHandler_1.asyncHandler)(home_controller_1.getHomePage));
exports.default = router;
