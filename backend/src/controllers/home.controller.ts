import { Request, Response } from "express";
import dotenv from 'dotenv';
import axios from "axios";
dotenv.config();



export const checkAPI = async (req: Request, res: Response) => {
    try {
        //to get this from the other API via axios:
        const response = await axios.get("https://lite-api.jup.ag/tokens/v2/search?query=MEME");
        const data = response.data;
        console.info("Data received from external API:", data);
        // basic health check response
        return res.status(200).json({ message: "Returned new data on meme coin" });
    } catch (error) {
        console.error("Unable to get users:\n", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

