import Joi from "joi";
import type { Request } from "express";
import { ROLES, DEFAULT_ROLE } from "@/shared/utils/constants";

export const SignUpSchema = (req: Request) => {
  const t = req.__ || req._t || ((key: any) => key);

  return Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        "string.base": t("validation.name_required"),
        "string.empty": t("validation.name_required"),
        "string.min": t("validation.name_min"),
        "string.max": t("validation.name_max"),
        "any.required": t("validation.name_required"),
      }),

    email: Joi.string()
      .email()
      .trim()
      .lowercase()
      .required()
      .messages({
        "string.email": t("validation.email_invalid"),
        "string.empty": t("validation.email_required"),
        "any.required": t("validation.email_required"),
      }),
    password: Joi.string()
      .min(8)
      .max(40)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/,
      )
      .required()
      .messages({
        "string.min": t("validation.password_min"),
        "string.max": t("validation.password_max"),
        "string.pattern.base": t("validation.password_pattern"),
        "string.empty": t("validation.password_required"),
        "any.required": t("validation.password_required"),
      }),

    role: Joi.string()
      .valid(...Object.values(ROLES))
      .default(DEFAULT_ROLE)
      .messages({
        "any.only": t("validation.role_invalid"),
        "string.base": t("validation.role_invalid"),
      }),
  });
};

export const LoginSchema = (req: Request) => {
  const t = req.__ || req._t || ((key: any) => key);

  return Joi.object({
    email: Joi.string()
      .email()
      .trim()
      .lowercase()
      .required()
      .messages({
        "string.email": t("validation.email_invalid"),
        "string.empty": t("validation.email_required"),
        "any.required": t("validation.email_required"),
      }),

    password: Joi.string()
      .required()
      .messages({
        "string.empty": t("validation.password_required"),
        "any.required": t("validation.password_required"),
      }),
  });
};

