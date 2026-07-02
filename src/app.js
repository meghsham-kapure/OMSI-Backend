import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import morgan from "morgan";

import errorHandler from "./middlewares/errorHandler.middleware.js";
import notFoundHandler from "./middlewares/notFound.middleware.js";
import appRouter from "./routes/app.router.js";

import * as AppConstants from "./constants/app.constants.js";

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: AppConstants.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "16kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);
app.use(cookieParser());
app.use(compression());
app.use(express.static("public"));

app.use("/api/v1", appRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
