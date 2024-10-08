import dotenv from "dotenv";
dotenv.config();
export const API_ADDRESS = process.env.API_ADDRESS;
export const PORT = parseInt(process.env.PORT || "4000");
export const MONGO_URI = process.env.MONGO_URI;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "";
