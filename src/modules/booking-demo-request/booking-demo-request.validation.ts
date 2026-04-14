import Joi from "joi";
import { phoneSchema } from "@/shared/validations/common.validations.js";

export const createBookingDemoRequestSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  companyName: Joi.string().trim().min(2).max(120).required(),
  jobTitle: Joi.string().trim().min(2).max(80).required(),
  phone: phoneSchema.required(),
  employeeCount: Joi.string()
    .trim()
    .required()
    .valid(
      "FROM_1_TO_25",
      "FROM_26_TO_100",
      "FROM_101_TO_250",
      "MORE_THAN_250",
      "1-25",
      "26-100",
      "101-250",
      "250+",
    ),
  interests: Joi.array()
    .items(
      Joi.string()
        .trim()
        .valid(
          "CORE_HR",
          "TALENT",
          "SPEND",
          "Core_HR_Suite",
          "Talent_Suite",
          "Spend_Suite",
        ),
    )
    .min(1)
    .required(),
});
