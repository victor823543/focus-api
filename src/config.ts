if (process.env.NODE_ENV !== "production") {
  // Dynamically import dotenv in development mode
  import("dotenv")
    .then((dotenv) => {
      dotenv.config();
    })
    .catch((err) => {
      console.error("Error loading dotenv:", err);
    });
}

export const API_ADDRESS = process.env.API_ADDRESS || "";
export const PORT = parseInt(process.env.PORT || "4000");
export const MONGO_URI = process.env.MONGO_URI || "";
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "";
