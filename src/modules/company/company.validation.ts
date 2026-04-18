import Joi from "joi";
import {
  phoneSchemaOptional,
  websiteSchema,
} from "@/shared/validations/common.validations.js";

const hhmmRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const updateCompanyInfoSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).messages({
    "string.min": "company.name.min",
    "string.max": "company.name.max",
  }),
  industry: Joi.string().trim().max(100).allow(null, "").messages({
    "string.max": "company.industry.max",
  }),
  country: Joi.string().trim().max(100).allow(null, "").messages({
    "string.max": "company.country.max",
  }),
  city: Joi.string().trim().max(100).allow(null, "").messages({
    "string.max": "company.city.max",
  }),
  address: Joi.string().trim().max(255).allow(null, "").messages({
    "string.max": "company.address.max",
  }),
  phone: phoneSchemaOptional.messages({
    "string.pattern.base": "validation.phone.invalid",
  }),
  website: websiteSchema.messages({
    "string.pattern.base": "company.website.invalid",
  }),
  taxNumber: Joi.string().trim().max(120).allow(null, "").messages({
    "string.max": "company.taxNumber.max",
  }),
  commercialReg: Joi.string().trim().max(120).allow(null, "").messages({
    "string.max": "company.commercialReg.max",
  }),
  currency: Joi.string().trim().max(12).allow(null, "").messages({
    "string.max": "company.currency.max",
  }),
  timezone: Joi.string().trim().max(60).allow(null, "").messages({
    "string.max": "company.timezone.max",
  }),
})
  .min(1)
  .messages({
    "object.min": "validation.body.empty",
  });

export const updateCompanySettingsSchema = Joi.object({
  language: Joi.string().valid("ar", "en").messages({
    "any.only": "company.settings.language.invalid",
  }),
  dateFormat: Joi.string()
    .valid("DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD")
    .messages({
      "any.only": "company.settings.dateFormat.invalid",
    }),
  fiscalYearStart: Joi.number().integer().min(1).max(12).messages({
    "number.base": "company.settings.fiscalYearStart.invalid",
    "number.integer": "company.settings.fiscalYearStart.invalid",
    "number.min": "company.settings.fiscalYearStart.range",
    "number.max": "company.settings.fiscalYearStart.range",
  }),
})
  .min(1)
  .messages({
    "object.min": "validation.body.empty",
  });

export const updateAttendanceSettingsSchema = Joi.object({
  workDayStart: Joi.string().pattern(hhmmRegex).messages({
    "string.pattern.base": "company.attendance.time.invalid",
  }),
  workDayEnd: Joi.string().pattern(hhmmRegex).messages({
    "string.pattern.base": "company.attendance.time.invalid",
  }),
  workingDays: Joi.array()
    .items(
      Joi.number().integer().min(0).max(6).messages({
        "number.base": "company.attendance.workingDays.invalid",
        "number.integer": "company.attendance.workingDays.invalid",
        "number.min": "company.attendance.workingDays.range",
        "number.max": "company.attendance.workingDays.range",
      }),
    )
    .min(1)
    .unique()
    .messages({
      "array.base": "company.attendance.workingDays.invalid",
      "array.min": "company.attendance.workingDays.min",
      "array.unique": "company.attendance.workingDays.unique",
    }),
  lateGraceMinutes: Joi.number().integer().min(0).max(120).messages({
    "number.base": "company.attendance.lateGraceMinutes.invalid",
    "number.integer": "company.attendance.lateGraceMinutes.invalid",
    "number.min": "company.attendance.lateGraceMinutes.range",
    "number.max": "company.attendance.lateGraceMinutes.range",
  }),
  earlyLeaveGrace: Joi.number().integer().min(0).max(240).messages({
    "number.base": "company.attendance.earlyLeaveGrace.invalid",
    "number.integer": "company.attendance.earlyLeaveGrace.invalid",
    "number.min": "company.attendance.earlyLeaveGrace.range",
    "number.max": "company.attendance.earlyLeaveGrace.range",
  }),
  overtimeThreshold: Joi.number().integer().min(0).max(480).messages({
    "number.base": "company.attendance.overtimeThreshold.invalid",
    "number.integer": "company.attendance.overtimeThreshold.invalid",
    "number.min": "company.attendance.overtimeThreshold.range",
    "number.max": "company.attendance.overtimeThreshold.range",
  }),
  roundingEnabled: Joi.boolean(),
  roundingMinutes: Joi.number().integer().valid(5, 10, 15, 30).messages({
    "any.only": "company.attendance.roundingMinutes.allowed",
    "number.base": "company.attendance.roundingMinutes.invalid",
    "number.integer": "company.attendance.roundingMinutes.invalid",
  }),
  requireBiometric: Joi.boolean(),
  geofenceEnabled: Joi.boolean(),
  geofenceLat: Joi.number().min(-90).max(90).messages({
    "number.base": "company.attendance.geofenceLat.invalid",
    "number.min": "company.attendance.geofenceLat.range",
    "number.max": "company.attendance.geofenceLat.range",
  }),
  geofenceLng: Joi.number().min(-180).max(180).messages({
    "number.base": "company.attendance.geofenceLng.invalid",
    "number.min": "company.attendance.geofenceLng.range",
    "number.max": "company.attendance.geofenceLng.range",
  }),
  geofenceRadiusM: Joi.number().integer().min(1).max(100000).messages({
    "number.base": "company.attendance.geofenceRadiusM.invalid",
    "number.integer": "company.attendance.geofenceRadiusM.invalid",
    "number.min": "company.attendance.geofenceRadiusM.range",
    "number.max": "company.attendance.geofenceRadiusM.range",
  }),
})
  .min(1)
  .messages({
    "object.min": "validation.body.empty",
  });
