import dotenv from "dotenv";

export const NODE_ENV = process.env.NODE_ENV || "";

// Load .env file only in development
if (["development", "devtest"].includes(NODE_ENV)) {
  dotenv.config();
}

export const ACTIVE_DB =
  NODE_ENV === "devtest" || process.env.ACTIVE_DB === "test"
    ? "test"
    : "production";
export const MONGO_URI =
  NODE_ENV === "devtest"
    ? process.env.MONGO_URI_TEST || ""
    : process.env.MONGO_URI || "";
export const API_ADDRESS = process.env.API_ADDRESS || "";
export const PORT = parseInt(process.env.PORT || "4000");
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "";
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
