import { Router } from "express";
import { chatbotController } from "./chatbot.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { UserRole } from "@prisma/client";
import chatbotRateLimiter from "@/shared/middleware/chatbotRateLimiter.middleware.js";
import { validate } from "@/shared/middleware/validate.middleware.js";
import { sendMessageSchema } from "./chatbot.validation.js";

const ChatbotRouter = Router();

const canAccessChatbot = checkRole([
  UserRole.EMPLOYEE,
  UserRole.MANAGER,
  UserRole.HR_ADMIN,
  UserRole.TENANT_OWNER,
]);

ChatbotRouter.use(requireAuth, canAccessChatbot);

ChatbotRouter.post(
  "/message",
  chatbotRateLimiter,
  validate(sendMessageSchema),
  chatbotController.sendMessage,
);

ChatbotRouter.get("/sessions", chatbotController.getSessions);

ChatbotRouter.get("/sessions/:sessionId/messages", chatbotController.getSessionMessages);

ChatbotRouter.get("/config", chatbotController.getConfig);

export { ChatbotRouter };
