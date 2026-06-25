import { Router } from "express";
import { bookingDemoRequestController } from "./booking-demo-request.controller.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { createBookingDemoRequestSchema } from "./booking-demo-request.validation.js";
import { requireSuperAdmin } from "@/shared/middleware/super-admin.middleware.js";

const router = Router();

router.post("/", validate(createBookingDemoRequestSchema), bookingDemoRequestController.create);
router.get("/", requireSuperAdmin, bookingDemoRequestController.getAll);

export { router as BookingDemoRequestRouter };