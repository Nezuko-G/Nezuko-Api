import type { NextFunction, Request, Response } from "express";
import { ChatbotService } from "./chatbot.service";
import { getSystemPrompt, MODEL_NAME } from "@/shared/config/gemini";

const chatbotService = new ChatbotService();

export const chatbotController = {
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { message, sessionId } = req.body;
      const { tenantId, id: userId, role } = req.user!;

      const result = await chatbotService.sendMessage(
        tenantId,
        userId,
        role,
        message,
        sessionId,
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getConfig(_req: Request, res: Response, _next: NextFunction) {
    res.json({
      success: true,
      data: {
        model: MODEL_NAME,
        systemPrompt: getSystemPrompt(),
      },
    });
  },

  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, id: userId } = req.user!;
      const sessions = await chatbotService.getSessions(tenantId, userId);
      res.json({ success: true, data: sessions });
    } catch (error) {
      next(error);
    }
  },

  async getSessionMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, id: userId } = req.user!;
      const sessionId = req.params.sessionId as string;
      const messages = await chatbotService.getSessionMessages(sessionId, tenantId, userId);
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  },
};
