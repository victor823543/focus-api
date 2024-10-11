import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import mongodb from "mongoose";
import { MONGO_URI } from "./config.js";
import { errorHandler } from "./handlers/errorHandler.js";

import "./models/Category.js";
import "./models/Colors.js";
import "./models/Day.js";
import "./models/Session.js";
import "./models/User.js";

import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import colorRoutes from "./routes/colors.js";
import dayRoutes from "./routes/days.js";
import sessionRoutes from "./routes/sessions.js";
import userRoutes from "./routes/users.js";

const server = express();

const port = 4000;

server.use(cors({ origin: "*" }));
server.use(bodyParser.json());

server.use("/api/users", userRoutes);
server.use("/api/sessions", sessionRoutes);
server.use("/api/categories", categoryRoutes);
server.use("/api/colors", colorRoutes);
server.use("/api/days", dayRoutes);
server.use("/api/auth", authRoutes);

server.use(errorHandler);

server.use("/api/health", (req, res) => {
  res.status(200).send("OK");
});

mongodb
  .connect(`${MONGO_URI}`)
  .then(() => {
    console.log("Successfully connected to mongodb.");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

server.listen(port, async () => {
  console.log(`Listening on port: ${port}`);
});

export default server;
