import Joi from "joi";
import { isValidPhoneNumber } from "libphonenumber-js";

const strictInternationalPhoneRegex = /^\+[1-9]\d{6,14}$/;
const websiteRegex =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&/=]*)$/;

/**
 * Reusable phone validation schema with international format support
 * Supports formats like: +201012345678, +44123456789, etc.
 */
export const phoneSchema = Joi.string()
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
  .messages({
    "string.pattern.base":
      "Phone number must be in international format like +201012345678",
  });

/**
 * Optional phone validation (nullable, can be empty string)
 */
export const phoneSchemaOptional = Joi.string()
  .trim()
  .custom((value, helpers) => {
    // Allow empty string
    if (value === "") {
      return value;
    }

    if (!strictInternationalPhoneRegex.test(value)) {
      return helpers.error("string.pattern.base");
    }

    if (!isValidPhoneNumber(value)) {
      return helpers.error("string.pattern.base");
    }

    return value;
  }, "global phone number validation")
  .allow(null, "")
  .messages({
    "string.pattern.base":
      "Phone number must be in international format like +201012345678",
  });

/**
 * Website validation schema with proper domain extension requirement
 * Examples: https://techinnovation.com, http://example.org, https://www.company.eg
 */
export const websiteSchema = Joi.string()
  .trim()
  .pattern(websiteRegex)
  .allow(null, "")
  .messages({
    "string.pattern.base":
      "Website must be a valid URL with domain extension like https://example.com",
  });

/**
 * Required website validation
 */
export const websiteSchemaRequired = Joi.string()
  .trim()
  .pattern(websiteRegex)
  .required()
  .messages({
    "string.pattern.base":
      "Website must be a valid URL with domain extension like https://example.com",
  });
