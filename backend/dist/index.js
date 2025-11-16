"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
dotenv_1.default.config();
const getHome_route_1 = __importDefault(require("./routes/getHome.route"));
const http_1 = __importDefault(require("http"));
const socket_1 = require("./socket");
const port = process.env.PORT || 5001;
const app = (0, express_1.default)();
// enable CORS for development (adjust origin in production)
app.use((0, cors_1.default)({ origin: (_a = process.env.CORS_ORIGIN) !== null && _a !== void 0 ? _a : '*' }));
app.use(express_1.default.json());
app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});
app.use("/home", getHome_route_1.default);
const server = http_1.default.createServer(app);
// initialize socket.io
(0, socket_1.initSocket)(server);
server.listen(port, () => {
    console.log(`now listening on port ${port}`);
});
