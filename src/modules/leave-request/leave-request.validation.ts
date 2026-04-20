import Joi from "joi";

export const createLeaveRequestSchema = Joi.object({
  startDate: Joi.date().iso().min("now").required().messages({
    "date.base": "validation.leaveRequest.startDate.invalid",
    "date.format": "validation.leaveRequest.startDate.invalid",
    "date.min": "validation.leaveRequest.startDate.past",
    "any.required": "validation.leaveRequest.startDate.required",
    "string.empty": "validation.leaveRequest.startDate.required",
  }),
  endDate: Joi.date().iso().min(Joi.ref("startDate")).required().messages({
    "date.base": "validation.leaveRequest.endDate.invalid",
    "date.format": "validation.leaveRequest.endDate.invalid",
    "date.min": "validation.leaveRequest.endDate.beforeStart",
    "any.required": "validation.leaveRequest.endDate.required",
    "string.empty": "validation.leaveRequest.endDate.required",
  }),
  reason: Joi.string().trim().min(10).max(500).required().messages({
    "string.min": "validation.leaveRequest.reason.min",
    "string.max": "validation.leaveRequest.reason.max",
    "any.required": "validation.leaveRequest.reason.required",
    "string.empty": "validation.leaveRequest.reason.required",
  }),
});

export const reviewLeaveRequestSchema = Joi.object({
  status: Joi.string()
    .trim()
    .uppercase()
    .valid("APPROVED", "REJECTED")
    .required()
    .messages({
      "any.only": "validation.leaveRequest.status.invalid",
      "any.required": "validation.leaveRequest.status.required",
      "string.empty": "validation.leaveRequest.status.required",
    }),
  reviewNote: Joi.string()
    .trim()
    .min(2)
    .max(1000)
    .when("status", {
      is: "REJECTED",
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      "string.empty": "validation.leaveRequest.reviewNote.required",
      "any.required": "validation.leaveRequest.reviewNote.required",
      "string.min": "validation.leaveRequest.reviewNote.min",
      "string.max": "validation.leaveRequest.reviewNote.max",
    }),
})
  .min(1)
  .messages({
    "object.min": "validation.body.empty",
  });
