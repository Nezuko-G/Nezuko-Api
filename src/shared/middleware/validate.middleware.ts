import { BadRequestError } from "@/shared/errors/errors";
import type {Request , Response , NextFunction } from "express";

export const validate = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const localizedSchema = typeof schema === "function" ? schema(req) : schema;
    const { error, value } = localizedSchema.validate(req.body, {
      abortEarly: true,
    });
    if (error) {
      return next(new BadRequestError(error.details.map((err: any) => err.message)));
    }
    req.body = value;
    next();
  };
};