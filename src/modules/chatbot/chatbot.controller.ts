import type { NextFunction, Request, Response } from "express";
import {
  sendChatbotMessage,
  getChatbotConfig,
} from "@/shared/config/google-gemini.js";

export const chatbotController = {
  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { message } = req.body;
      const t = req._t;

      if (!message || typeof message !== "string") {
        return res.status(400).json({
          success: false,
          message: t("chatbot.error_invalid_message"),
        });
      }

      const result = await sendChatbotMessage(message, t);

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const t = req._t;
      const config = getChatbotConfig(t);

      res.status(200).json({
        success: true,
        data: {
          model: config.model,
          welcomeMessage: config.welcomeMessage,
          generalHelp: config.generalHelp,
          contactHR: config.contactHR,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const t = req._t;

      const messages = {
        welcome: t("chatbot.welcome_message"),
        generalHelp: t("chatbot.general_help"),
        contactHR: t("chatbot.contact_hr"),
        sessionStarted: t("chatbot.session_started"),
        sessionEnded: t("chatbot.session_ended"),
        typing: t("chatbot.typing"),
        noResponse: t("chatbot.no_response"),
        responseTimeout: t("chatbot.response_timeout"),
        invalidRequest: t("chatbot.invalid_request"),
        rateLimitExceeded: t("chatbot.rate_limit_exceeded"),
        errorSending: t("chatbot.error_sending_message"),
        errorInvalidMessage: t("chatbot.error_invalid_message"),
        errorApiKeyMissing: t("chatbot.error_api_key_missing"),
        errorServiceUnavailable: t("chatbot.error_service_unavailable"),
      };

      res.status(200).json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  },
};
