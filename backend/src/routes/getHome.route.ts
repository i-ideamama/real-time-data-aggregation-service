import express from "express";
import {checkAPI} from "../controllers/home.controller";

const router=express.Router();

router.get("/getHomePage",checkAPI);

export default router;
