import { Router } from "express";
import { AuthRouter } from "../auth";
import { BookingDemoRequestRouter } from "../booking-demo-request";
import { CompanyRouter } from "../company";
import { EmployeeRouter } from "../employee";
import { LeaveRequestRouter } from "../leave-request";
import { DepartmentRouter }from '../department';

const router = Router();

router.use("/auth", AuthRouter);
router.use("/booking-demo-request", BookingDemoRequestRouter);
router.use("/company", CompanyRouter);
router.use("/employee", EmployeeRouter);
router.use("/leave-requests", LeaveRequestRouter);
router.use("/department", DepartmentRouter);
export { router as GlobalRouter };