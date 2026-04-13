import { Router } from "express";
import { bookingDemoRequestController } from "./booking-demo-request.controller.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { createBookingDemoRequestSchema } from "./booking-demo-request.validation.js";

const router = Router();

router.post(
  "/",
  validate(createBookingDemoRequestSchema),
  bookingDemoRequestController.create,
);

export { router as BookingDemoRequestRouter };
