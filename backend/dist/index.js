"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const getHome_route_1 = __importDefault(require("./routes/getHome.route"));
const port = process.env.PORT || 5001;
const app = (0, express_1.default)();
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use("/home", getHome_route_1.default);
app.listen(port, () => {
    console.log(`now listening on port ${port}`);
});
