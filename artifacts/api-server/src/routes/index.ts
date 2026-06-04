import { Router, type IRouter } from "express";
import healthRouter from "./health";
import spreadsheetRouter from "./spreadsheet";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/spreadsheet", spreadsheetRouter);

export default router;
