import type { Request, Response, NextFunction } from "express";
import type { ObjectSchema } from "joi";
import { BadRequestError } from "@/shared/errors/errors.js";

export const validate = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: true });

    if (error) {
      const messageKey = error.details[0].message;
      const translated = req._t(messageKey);
      return next(new BadRequestError(translated));
    }

    next();
  };
};