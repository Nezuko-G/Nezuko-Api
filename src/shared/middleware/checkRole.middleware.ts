import type { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/errors";
import { UserRole } from "@prisma/client";

export const checkRole = (allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const t = req.__ || req._t || ((key: any) => key);

    const userRole = req.user?.role;

    if (!userRole) {
      return next(new UnauthorizedError(t("auth.unauthorized")));
    }

    if (!allowedRoles.includes(userRole)) {
      return next(new ForbiddenError(t("auth.forbidden")));
    }

    next();
  };
};
