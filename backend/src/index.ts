import express, { Request, Response } from "express";
import dotenv from 'dotenv';
import cors from 'cors';
dotenv.config();
import getHomePageRoute from './routes/getHome.route';
import http from 'http';
import { initSocket } from './socket';

const port = process.env.PORT || 5001;
const app = express();

// enable CORS for development (adjust origin in production)
app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/home", getHomePageRoute);

const server = http.createServer(app);
// initialize socket.io
initSocket(server);

server.listen(port, () => {
  console.log(`now listening on port ${port}`);
});
