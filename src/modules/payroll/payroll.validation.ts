import Joi from "joi";

const PAYROLL_STATUSES  = ["DRAFT", "APPROVED", "PAID"];
const INCENTIVE_TYPES   = ["BONUS", "COMMISSION", "OVERTIME", "DEDUCTION", "OTHER"];


export const createPayrollRunSchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required().messages({
    "number.base":    "validation.payroll.month.invalid",
    "number.integer": "validation.payroll.month.invalid",
    "number.min":     "validation.payroll.month.range",
    "number.max":     "validation.payroll.month.range",
    "any.required":   "validation.payroll.month.required",
  }),
  year: Joi.number().integer().min(2000).max(2100).required().messages({
    "number.base":    "validation.payroll.year.invalid",
    "number.integer": "validation.payroll.year.invalid",
    "number.min":     "validation.payroll.year.range",
    "number.max":     "validation.payroll.year.range",
    "any.required":   "validation.payroll.year.required",
  }),
});

export const listRunsQuerySchema = Joi.object({
  status: Joi.string().valid(...PAYROLL_STATUSES).optional().messages({
    "any.only": "validation.payroll.status.invalid",
  }),
  year: Joi.number().integer().min(2000).max(2100).optional().messages({
    "number.base": "validation.payroll.year.invalid",
    "number.min":  "validation.payroll.year.range",
    "number.max":  "validation.payroll.year.range",
  }),
  page:  Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});


export const createIncentiveSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    "string.guid":  "validation.payroll.userId.invalid",
    "any.required": "validation.payroll.userId.required",
  }),
  type: Joi.string().valid(...INCENTIVE_TYPES).required().messages({
    "any.only":     "validation.payroll.incentiveType.invalid",
    "any.required": "validation.payroll.incentiveType.required",
  }),
  amount: Joi.number().positive().required().messages({
    "number.base":     "validation.payroll.amount.invalid",
    "number.positive": "validation.payroll.amount.positive",
    "any.required":    "validation.payroll.amount.required",
  }),
  description: Joi.string().trim().max(500).allow(null, "").optional().messages({
    "string.max": "validation.payroll.description.max",
  }),
  effectiveDate: Joi.date().iso().required().messages({
    "date.base":    "validation.payroll.effectiveDate.invalid",
    "date.format":  "validation.payroll.effectiveDate.invalid",
    "any.required": "validation.payroll.effectiveDate.required",
  }),
});

export const listIncentivesQuerySchema = Joi.object({
  userId: Joi.string().uuid().optional().messages({
    "string.guid": "validation.payroll.userId.invalid",
  }),
  type: Joi.string().valid(...INCENTIVE_TYPES).optional().messages({
    "any.only": "validation.payroll.incentiveType.invalid",
  }),
  month: Joi.number().integer().min(1).max(12).optional().messages({
    "number.base": "validation.payroll.month.invalid",
    "number.min":  "validation.payroll.month.range",
    "number.max":  "validation.payroll.month.range",
  }),
  year: Joi.number().integer().min(2000).max(2100).optional().messages({
    "number.base": "validation.payroll.year.invalid",
    "number.min":  "validation.payroll.year.range",
    "number.max":  "validation.payroll.year.range",
  }),
  page:  Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const summaryReportQuerySchema = Joi.object({
  month: Joi.number().integer().min(1).max(12).required().messages({
    "number.base":    "validation.payroll.month.invalid",
    "number.integer": "validation.payroll.month.invalid",
    "number.min":     "validation.payroll.month.range",
    "number.max":     "validation.payroll.month.range",
    "any.required":   "validation.payroll.month.required",
  }),
  year: Joi.number().integer().min(2000).max(2100).required().messages({
    "number.base":    "validation.payroll.year.invalid",
    "number.integer": "validation.payroll.year.invalid",
    "number.min":     "validation.payroll.year.range",
    "number.max":     "validation.payroll.year.range",
    "any.required":   "validation.payroll.year.required",
  }),
});