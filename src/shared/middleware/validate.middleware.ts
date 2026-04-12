import { BadRequestError } from "@/shared/errors/errors";
import type { Request, Response, NextFunction } from "express";
import type { ObjectSchema } from "joi";

export const validate = (schema: ObjectSchema | ((req: Request) => ObjectSchema), property: "body" | "params" | "query" = "body") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const localizedSchema = typeof schema === "function" ? schema(req) : schema;
      const value = await localizedSchema.validateAsync(req[property], { abortEarly: false });
      req[property] = value;
      next();
    } catch (error: any) {
      const messages = error.details ? error.details.map((err: any) => err.message) : [error.message];
      next(new BadRequestError(messages));
    }
  };
};