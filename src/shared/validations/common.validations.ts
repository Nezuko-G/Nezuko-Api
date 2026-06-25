import Joi from "joi";
import { isValidPhoneNumber } from "libphonenumber-js";

const INTL_PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

const WEBSITE_REGEX =
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

function phoneCustomValidator(value: string, helpers: Joi.CustomHelpers) {
    if (!INTL_PHONE_REGEX.test(value) || !isValidPhoneNumber(value)) {
        return helpers.error("string.pattern.base");
    }
    return value;
}

/**
 * Reusable phone validation schema with international format support.
 * Supports formats like: +201012345678, +44123456789, etc.
 */
export const phoneSchema = Joi.string()
    .trim()
    .custom(phoneCustomValidator)
    .messages({
        "string.pattern.base": "validation.phone.invalid",
        "string.empty": "validation.phone.required",
        "any.required": "validation.phone.required",
    });

/**
 * Optional phone validation — allows null or empty string.
 * Joi resolves allow(null, "") before reaching the custom validator,
 * so no need for an empty-string guard inside the function.
 */
export const phoneSchemaOptional = Joi.string()
    .trim()
    .allow(null, "")
    .custom(phoneCustomValidator)
    .messages({
        "string.pattern.base": "validation.phone.invalid",
    });

/**
 * Optional website URL — http or https only.
 * Examples: https://techinnovation.com, http://example.org, https://www.company.eg
 */
export const websiteSchema = Joi.string()
    .trim()
    .pattern(WEBSITE_REGEX)
    .allow(null, "")
    .messages({
        "string.pattern.base": "company.website.invalid",
    });

/**
 * Required website URL — http or https only.
 */
export const websiteSchemaRequired = Joi.string()
    .trim()
    .pattern(WEBSITE_REGEX)
    .required()
    .messages({
        "string.pattern.base": "company.website.invalid",
        "string.empty": "company.website.required",
        "any.required": "company.website.required",
    });