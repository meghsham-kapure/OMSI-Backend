import { Router } from "express";
import infoRouter from "./info.router.js";
import userRouter from "./user.router.js";
import projectRouter from "./project.router.js";
import teamRouter from "./employee.router.js";

const appRouter = Router();

appRouter.use("/info", infoRouter);
appRouter.use("/user", userRouter);
appRouter.use("/project", projectRouter);
appRouter.use("/employee", teamRouter);

export default appRouter;
