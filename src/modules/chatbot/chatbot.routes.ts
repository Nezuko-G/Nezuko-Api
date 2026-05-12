import { Router } from "express";
import { chatbotController } from "./chatbot.controller.js";
import { requireAuth } from "@/shared/middleware/auth.middleware.js";
import { checkRole } from "@/shared/middleware/checkRole.middleware.js";
import { UserRole } from "@prisma/client";

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
    chatbotController.sendMessage
);

ChatbotRouter.get(
    "/config", 
    chatbotController.getConfig
);

ChatbotRouter.get(
    "/messages", 
    chatbotController.getMessages
);

export { ChatbotRouter };
