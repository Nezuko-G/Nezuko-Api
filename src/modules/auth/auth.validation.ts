import Joi from "joi";

export const loginSchema = Joi.object({
    companyEmail: Joi.string().email().required().messages({
        "string.base": "validation.auth.company_email.string",
        "string.email": "validation.auth.company_email.format",
        "any.required": "validation.auth.company_email.required",
        "string.empty": "validation.auth.company_email.required",
    }),
    userEmail: Joi.string().email().required().messages({
        "string.base": "validation.auth.user_email.string",
        "string.email": "validation.auth.user_email.format",
        "any.required": "validation.auth.user_email.required",
        "string.empty": "validation.auth.user_email.required",
    }),
    password: Joi.string().min(6).required().messages({
        "string.base": "validation.auth.password.string",
        "string.min": "validation.auth.password.min",
        "any.required": "validation.auth.password.required",
        "string.empty": "validation.auth.password.required",
    }),
});