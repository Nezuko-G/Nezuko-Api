import Joi from "joi";
import {
  phoneSchemaOptional,
  websiteSchema,
} from "@/shared/validations/common.validations.js";

const hhmmRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const updateCompanyInfoSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  industry: Joi.string().trim().max(100).allow(null, ""),
  country: Joi.string().trim().max(100).allow(null, ""),
  city: Joi.string().trim().max(100).allow(null, ""),
  address: Joi.string().trim().max(255).allow(null, ""),
  phone: phoneSchemaOptional,
  website: websiteSchema,
  taxNumber: Joi.string().trim().max(120).allow(null, ""),
  commercialReg: Joi.string().trim().max(120).allow(null, ""),
  currency: Joi.string().trim().max(12).allow(null, ""),
  timezone: Joi.string().trim().max(60).allow(null, ""),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required",
  });

export const updateCompanySettingsSchema = Joi.object({
  language: Joi.string().valid("ar", "en"),
  dateFormat: Joi.string().valid("DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"),
  fiscalYearStart: Joi.number().integer().min(1).max(12),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required",
  });

export const updateAttendanceSettingsSchema = Joi.object({
  workDayStart: Joi.string().pattern(hhmmRegex),
  workDayEnd: Joi.string().pattern(hhmmRegex),
  workingDays: Joi.array()
    .items(Joi.number().integer().min(0).max(6))
    .min(1)
    .unique(),
  lateGraceMinutes: Joi.number().integer().min(0).max(120),
  earlyLeaveGrace: Joi.number().integer().min(0).max(240),
  overtimeThreshold: Joi.number().integer().min(0).max(480),
  roundingEnabled: Joi.boolean(),
  roundingMinutes: Joi.number().integer().valid(5, 10, 15, 30),
  requireBiometric: Joi.boolean(),
  geofenceEnabled: Joi.boolean(),
  geofenceLat: Joi.number().min(-90).max(90),
  geofenceLng: Joi.number().min(-180).max(180),
  geofenceRadiusM: Joi.number().integer().min(1).max(100000),
})
  .min(1)
  .messages({
    "object.min": "At least one field is required",
    "string.pattern.base": "Time must be in HH:mm format",
  });
