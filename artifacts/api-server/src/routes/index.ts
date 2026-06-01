import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import alertsRouter from "./alerts";
import patrolsRouter from "./patrols";
import incidentsRouter from "./incidents";
import broadcastsRouter from "./broadcasts";
import shiftsRouter from "./shifts";
import logsRouter from "./logs";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(alertsRouter);
router.use(patrolsRouter);
router.use(incidentsRouter);
router.use(broadcastsRouter);
router.use(shiftsRouter);
router.use(logsRouter);
router.use(statsRouter);

export default router;
