import Joi from "joi";

export const sendMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(4000).required().messages({
    "string.empty": "Message cannot be empty",
    "any.required": "Message is required",
    "string.max": "Message must not exceed 4000 characters",
  }),
  sessionId: Joi.string().uuid().optional().messages({
    "string.guid": "Invalid session ID format",
  }),
});
