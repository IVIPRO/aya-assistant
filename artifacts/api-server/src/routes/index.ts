import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import familiesRouter from "./families";
import childrenRouter from "./children";
import chatRouter from "./chat";
import memoriesRouter from "./memories";
import missionsRouter from "./missions";
import calendarRouter from "./calendar";
import familyTasksRouter from "./familyTasks";
import progressRouter from "./progress";
import lessonsRouter from "./lessons";
import learningRouter from "./learning";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(familiesRouter);
router.use(childrenRouter);
router.use(chatRouter);
router.use(memoriesRouter);
router.use(missionsRouter);
router.use(calendarRouter);
router.use(familyTasksRouter);
router.use(progressRouter);
router.use(lessonsRouter);
router.use(learningRouter);

export default router;
