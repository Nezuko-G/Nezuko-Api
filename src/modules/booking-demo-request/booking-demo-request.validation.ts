import Joi from "joi";
import { isValidPhoneNumber } from "libphonenumber-js";

const strictInternationalPhoneRegex = /^\+[1-9]\d{6,14}$/;

export const createBookingDemoRequestSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  companyName: Joi.string().trim().min(2).max(120).required(),
  jobTitle: Joi.string().trim().min(2).max(80).required(),
  phone: Joi.string()
    .trim()
    .custom((value, helpers) => {
      if (!strictInternationalPhoneRegex.test(value)) {
        return helpers.error("string.pattern.base");
      }

      if (!isValidPhoneNumber(value)) {
        return helpers.error("string.pattern.base");
      }

      return value;
    }, "global phone number validation")
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be in international format like +201012345678",
    }),
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
