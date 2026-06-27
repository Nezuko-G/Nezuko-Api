import { Router } from "express";
import { requireUserOrSuperAdminAuth } from "@/shared/middleware/requireUserOrSuperAdminAuth.middleware.js";
import { notificationController } from "./notification.controller.js";

const router = Router();

router.use(requireUserOrSuperAdminAuth);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/mark-all-seen", notificationController.markAllAsSeen);
router.patch("/:id/seen", notificationController.markAsSeen);

export { router as NotificationRouter };
