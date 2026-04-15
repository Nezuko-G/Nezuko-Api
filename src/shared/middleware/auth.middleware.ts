import type { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";
import { verifyToken } from "@/shared/utils/jwt.js";
import { UnauthorizedError } from "@/shared/errors/errors.js";

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const t = req.__ || req._t || ((key: string) => key);

  const bearerToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.jwt || bearerToken;

  if (!token) {
    return next(new UnauthorizedError(t("auth.unauthorized")));
  }

  const payload = verifyToken(token);

  if (
    !payload ||
    payload.type !== "user" ||
    !payload.userId ||
    !payload.role ||
    !payload.tenantId ||
    !Object.values(UserRole).includes(payload.role as UserRole)
  ) {
    return next(new UnauthorizedError(t("auth.unauthorized")));
  }

  req.user = {
    id: payload.userId,
    tenantId: payload.tenantId,
    role: payload.role as UserRole,
    type: payload.type,
  };

  next();
};
