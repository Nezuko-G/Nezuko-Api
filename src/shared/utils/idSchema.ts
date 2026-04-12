import Joi from "joi";
import type { Request } from "express";

export const idParamSchema = (req: Request) => {
    const t = req.__ || req._t || ((key: any) => key);

    return Joi.object({
        id: Joi.string()
            .length(24)
            .hex()
            .required()
            .messages({
                "string.base": t("validation.id_string"),
                "string.empty": t("validation.id_required"),
                "string.length": t("validation.id_length"),
                "string.hex": t("validation.id_hex"),
                "any.required": t("validation.id_required"),
            }),
    });
};