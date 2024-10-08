var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import mongodb from "mongoose";
import { MONGO_URI, PORT } from "./config.js";
import { errorHandler } from "./handlers/errorHandler.js";
import "./models/Category.js";
import "./models/Colors.js";
import "./models/Day.js";
import "./models/Session.js";
import "./models/User.js";
import categoryRoutes from "./routes/categories.js";
import colorRoutes from "./routes/colors.js";
import dayRoutes from "./routes/days.js";
import sessionRoutes from "./routes/sessions.js";
import userRoutes from "./routes/users.js";
const server = express();
server.use(cors({ origin: "*" }));
server.use(bodyParser.json());
server.use("/users", userRoutes);
server.use("/sessions", sessionRoutes);
server.use("/categories", categoryRoutes);
server.use("/colors", colorRoutes);
server.use("/days", dayRoutes);
server.use(errorHandler);
mongodb
    .connect(`${MONGO_URI}`)
    .then(() => {
    console.log("Successfully connected to mongodb.");
})
    .catch((err) => {
    console.error(err);
    process.exit(1);
});
server.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Listening on http://localhost:${PORT}/`);
}));
export default server;
