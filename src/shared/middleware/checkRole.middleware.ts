import type { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors/errors";

interface AuthRequest extends Request {
  user?: { role?: string }; 
}

export const checkRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;

    if (!userRole) {
      return next(new UnauthorizedError("Unauthorized"));
    }

    if (!allowedRoles.includes(userRole)) {
      return next(new ForbiddenError("Forbidden: You don't have permission"));
    }

    next();
  };
};
