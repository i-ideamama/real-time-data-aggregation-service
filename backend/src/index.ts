import express, { Request, Response } from "express";
import dotenv from 'dotenv';
dotenv.config();
import getHomePageRoute from './routes/getHome.route';
import http from "http";
import { Server as IOServer } from "socket.io";
import axios from "axios";
import path from "path";

const port=process.env.PORT||5001;
const app= express();


app.get("/health",(req,res)=>{
    res.status(200).json({status:"ok"});
})

app.use("/home",getHomePageRoute);

app.listen(port, () => {
  console.log(`now listening on port ${port}`);
});
