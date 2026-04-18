import Joi from "joi";

export const createEmployeeSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "validation.firstName.required",
    "any.required": "validation.firstName.required",
    "string.min": "validation.firstName.min",
    "string.max": "validation.firstName.max",
  }),
  lastName: Joi.string().trim().min(2).max(50).required().messages({
    "string.empty": "validation.lastName.required",
    "any.required": "validation.lastName.required",
    "string.min": "validation.lastName.min",
    "string.max": "validation.lastName.max",
  }),
  email: Joi.string().trim().email().required().messages({
    "string.empty": "validation.email.required",
    "any.required": "validation.email.required",
    "string.email": "validation.email.invalid",
  }),
  jobTitle: Joi.string().trim().max(100).optional().messages({
    "string.max": "validation.jobTitle.max",
  }),
  hireDate: Joi.date().iso().optional().messages({
    "date.base": "validation.hireDate.invalid",
    "date.format": "validation.hireDate.invalid",
  }),
  gender: Joi.string().valid("MALE", "FEMALE").optional().messages({
    "any.only": "validation.gender.invalid",
  }),
  dateOfBirth: Joi.date().iso().max("now").optional().messages({
    "date.base": "validation.dateOfBirth.invalid",
    "date.format": "validation.dateOfBirth.invalid",
    "date.max": "validation.dateOfBirth.max",
  }),
  phone: Joi.string().trim().pattern(/^\+?[0-9]{7,15}$/).optional().messages({
    "string.pattern.base": "validation.phone.invalid",
  }),
});

export const updateEmployeeSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional().messages({
    "string.min": "validation.firstName.min",
    "string.max": "validation.firstName.max",
  }),
  lastName: Joi.string().trim().min(2).max(50).optional().messages({
    "string.min": "validation.lastName.min",
    "string.max": "validation.lastName.max",
  }),
  email: Joi.string().trim().email().optional().messages({
    "string.email": "validation.email.invalid",
  }),
  jobTitle: Joi.string().trim().max(100).allow(null).optional().messages({
    "string.max": "validation.jobTitle.max",
  }),
  departmentId: Joi.string().uuid().allow(null).optional().messages({
    "string.guid": "validation.departmentId.invalid",
  }),
  hireDate: Joi.date().iso().allow(null).optional().messages({
    "date.base": "validation.hireDate.invalid",
  }),
  gender: Joi.string().valid("MALE", "FEMALE").allow(null).optional().messages({
    "any.only": "validation.gender.invalid",
  }),
  dateOfBirth: Joi.date().iso().max("now").allow(null).optional().messages({
    "date.base": "validation.dateOfBirth.invalid",
    "date.max": "validation.dateOfBirth.max",
  }),
  phone: Joi.string().trim().pattern(/^\+?[0-9]{7,15}$/).allow(null).optional().messages({
    "string.pattern.base": "validation.phone.invalid",
  }),
  country: Joi.string().trim().max(100).allow(null).optional(),
  city: Joi.string().trim().max(100).allow(null).optional(),
  address: Joi.string().trim().max(255).allow(null).optional(),
  emergencyName: Joi.string().trim().max(100).allow(null).optional(),
  emergencyPhone: Joi.string().trim().pattern(/^\+?[0-9]{7,15}$/).allow(null).optional().messages({
    "string.pattern.base": "validation.phone.invalid",
  }),
  emergencyRelation: Joi.string().trim().max(100).allow(null).optional(),
}).min(1).messages({
  "object.min": "validation.body.empty",
});

export const uploadDocumentSchema = Joi.object({
  fileName: Joi.string().trim().required().messages({
    "string.empty": "validation.fileName.required",
    "any.required": "validation.fileName.required",
  }),
  expiryDate: Joi.date().iso().min("now").allow(null).optional().messages({
    "date.base": "validation.expiryDate.invalid",
    "date.min": "validation.expiryDate.min",
  }),
});