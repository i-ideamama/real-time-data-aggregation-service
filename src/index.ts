import express, { Request, Response } from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import Redis from "ioredis";
import axios from "axnpios";
import path from "path";

const app: Express = express();

app.get("/", (req: Request, res: Response) => {
  res.send("hihihi");
});

app.get("/hi", (req: Request, res: Response) => {
  res.send("BYEEE!!");
});

app.listen(port, () => {
  console.log(`now listening on port ${port}`);
});
