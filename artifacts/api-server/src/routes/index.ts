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
import visionRouter from "./vision";
import voiceRouter from "./voice";
import dailyPlanRouter from "./dailyPlan";

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
router.use(visionRouter);
router.use(voiceRouter);
router.use(dailyPlanRouter);

export default router;
