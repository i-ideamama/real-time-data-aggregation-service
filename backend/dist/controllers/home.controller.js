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
const dotenv_1 = __importDefault(require("dotenv"));
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const checkAPI = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //to get this from the other API via axios:
        const response = yield axios_1.default.get("https://lite-api.jup.ag/tokens/v2/search?query=MEME");
        const data = response.data;
        console.info("Data received from external API:", data);
        // basic health check response
        return res.status(200).json({ message: "Returned new data on meme coin" });
    }
    catch (error) {
        console.error("Unable to get users:\n", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});
exports.checkAPI = checkAPI;
