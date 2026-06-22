import Joi from "joi";
import { phoneSchema } from "@/shared/validations/common.validations";

const interestSchema = Joi.string()
  .trim()
  .valid(
    "CORE_HR",
    "TALENT",
    "SPEND",
    "Core_HR_Suite",
    "Talent_Suite",
    "Spend_Suite",
  )
  .messages({
    "any.only": "booking_demo_request.validation.interests.invalid",
    "string.base": "booking_demo_request.validation.interests.invalid",
  });

export const createBookingDemoRequestSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "booking_demo_request.validation.fullName.required",
    "any.required": "booking_demo_request.validation.fullName.required",
    "string.min": "booking_demo_request.validation.fullName.min",
    "string.max": "booking_demo_request.validation.fullName.max",
  }),
  email: Joi.string().trim().email().required().messages({
    "string.empty": "booking_demo_request.validation.email.required",
    "any.required": "booking_demo_request.validation.email.required",
    "string.email": "booking_demo_request.validation.email.invalid",
  }),
  companyName: Joi.string().trim().min(2).max(120).required().messages({
    "string.empty": "booking_demo_request.validation.companyName.required",
    "any.required": "booking_demo_request.validation.companyName.required",
    "string.min": "booking_demo_request.validation.companyName.min",
    "string.max": "booking_demo_request.validation.companyName.max",
  }),
  jobTitle: Joi.string().trim().min(2).max(80).required().messages({
    "string.empty": "booking_demo_request.validation.jobTitle.required",
    "any.required": "booking_demo_request.validation.jobTitle.required",
    "string.min": "booking_demo_request.validation.jobTitle.min",
    "string.max": "booking_demo_request.validation.jobTitle.max",
  }),
  phone: phoneSchema.required().messages({
    "string.empty": "booking_demo_request.validation.phone.required",
    "any.required": "booking_demo_request.validation.phone.required",
    "string.pattern.base": "booking_demo_request.validation.phone.invalid",
  }),
  employeeCount: Joi.string()
    .trim()
    .valid(
      "FROM_1_TO_25",
      "FROM_26_TO_100",
      "FROM_101_TO_250",
      "MORE_THAN_250",
      "1-25",
      "26-100",
      "101-250",
      "250+",
    )
    .required()
    .messages({
      "string.empty": "booking_demo_request.validation.employeeCount.required",
      "any.required": "booking_demo_request.validation.employeeCount.required",
      "any.only": "booking_demo_request.validation.employeeCount.invalid",
    }),
  interests: Joi.array().items(interestSchema).min(1).required().messages({
    "array.base": "booking_demo_request.validation.interests.invalid",
    "array.min": "booking_demo_request.validation.interests.min",
    "any.required": "booking_demo_request.validation.interests.required",
  }),
});
