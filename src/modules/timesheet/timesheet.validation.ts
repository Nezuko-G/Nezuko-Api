import Joi from "joi";

const TIMESHEET_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"];

const REVIEWABLE_STATUSES = ["APPROVED", "REJECTED"];

const timesheetEntrySchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    "string.guid": "validation.timesheet.userId.invalid",
    "any.required": "validation.timesheet.userId.required",
    "string.empty": "validation.timesheet.userId.required",
  }),
  date: Joi.date().iso().required().messages({
    "date.base": "validation.timesheet.date.invalid",
    "date.format": "validation.timesheet.date.invalid",
    "any.required": "validation.timesheet.date.required",
    "string.empty": "validation.timesheet.date.required",
  }),
  checkIn: Joi.date().iso().allow(null).optional().messages({
    "date.base": "validation.timesheet.checkIn.invalid",
    "date.format": "validation.timesheet.checkIn.invalid",
  }),
  checkOut: Joi.date().iso().allow(null).optional().messages({
    "date.base": "validation.timesheet.checkOut.invalid",
    "date.format": "validation.timesheet.checkOut.invalid",
  }),
  notes: Joi.string().trim().max(1000).allow(null, "").optional().messages({
    "string.max": "validation.timesheet.notes.max",
  }),
});

export const createTimesheetsSchema = Joi.object({
  status: Joi.string()
    .trim()
    .uppercase()
    .valid(...TIMESHEET_STATUSES)
    .optional()
    .messages({
      "any.only": "validation.timesheet.status.invalid",
    }),
  entries: Joi.array().items(timesheetEntrySchema).min(1).required().messages({
    "array.base": "validation.timesheet.entries.required",
    "array.min": "validation.timesheet.entries.min",
    "any.required": "validation.timesheet.entries.required",
  }),
});

export const updateTimesheetSchema = Joi.object({
  date: Joi.date().iso().optional().messages({
    "date.base": "validation.timesheet.date.invalid",
    "date.format": "validation.timesheet.date.invalid",
  }),
  checkIn: Joi.date().iso().allow(null).optional().messages({
    "date.base": "validation.timesheet.checkIn.invalid",
    "date.format": "validation.timesheet.checkIn.invalid",
  }),
  checkOut: Joi.date().iso().allow(null).optional().messages({
    "date.base": "validation.timesheet.checkOut.invalid",
    "date.format": "validation.timesheet.checkOut.invalid",
  }),
  notes: Joi.string().trim().max(1000).allow(null, "").optional().messages({
    "string.max": "validation.timesheet.notes.max",
  }),
  status: Joi.string()
    .trim()
    .uppercase()
    .valid("DRAFT", "SUBMITTED")
    .optional()
    .messages({
      "any.only": "validation.timesheet.status.update_invalid",
    }),
})
  .min(1)
  .messages({
    "object.min": "validation.body.empty",
  });

export const updateTimesheetStatusSchema = Joi.object({
  status: Joi.string()
    .trim()
    .uppercase()
    .valid(...REVIEWABLE_STATUSES)
    .required()
    .messages({
      "any.only": "validation.timesheet.status.review_invalid",
      "any.required": "validation.timesheet.status.required",
      "string.empty": "validation.timesheet.status.required",
    }),
});
