import Joi from "joi";

export const superAdminLoginSchema = Joi.object({
    email: Joi.string().trim().email().lowercase().required().messages({
        "string.empty": "validation.auth.email.required",
        "any.required": "validation.auth.email.required",
        "string.email": "validation.auth.email.invalid",
    }),
    password: Joi.string().min(6).required().messages({
        "string.empty": "validation.auth.password.required",
        "any.required": "validation.auth.password.required",
        "string.min": "validation.auth.password.min",
    }),
});