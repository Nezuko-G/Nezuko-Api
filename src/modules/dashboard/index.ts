import { Router } from "express";
import { AuthRouter } from "../auth";
import { BookingDemoRequestRouter } from "../booking-demo-request";
import { CompanyRouter } from "../company";
import { EmployeeRouter } from "../employee";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/booking-demo-request", BookingDemoRequestRouter);
router.use("/company", CompanyRouter);
router.use("/employee", EmployeeRouter);

export { router as GlobalRouter };
