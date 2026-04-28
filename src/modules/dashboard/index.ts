import { Router } from "express";
import { AuthRouter } from "../auth";
import { BookingDemoRequestRouter } from "../booking-demo-request";
import { InsuranceRouter } from "../insurance";
import { CompanyRouter } from "../company";
import { EmployeeRouter } from "../employee";
import { LeaveRequestRouter } from "../leave-request";
import { DepartmentRouter } from "../department";
import { ProjectRouter } from "../project";
import { TimesheetRouter } from "../timesheet";
import { AttendanceRouter } from "../attendance";
import { PayrollRouter } from "../payroll";
import { AssetRouter } from "../asset";
import { ReportsRouter } from "../reports";

const router = Router();

router.use("/auth", AuthRouter);
router.use("/booking-demo-request", BookingDemoRequestRouter);
router.use("/", InsuranceRouter);
router.use("/company", CompanyRouter);
router.use("/employee", EmployeeRouter);
router.use("/leave-requests", LeaveRequestRouter);
router.use("/department", DepartmentRouter);
router.use("/asset", AssetRouter);
router.use("/project", ProjectRouter);
router.use("/timesheets", TimesheetRouter);
router.use("/attendance", AttendanceRouter);
router.use("/payrolls", PayrollRouter);
router.use("/reports", ReportsRouter);

export { router as GlobalRouter };
