import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "@/shared/errors/errors.js";
import { verifyToken } from "@/shared/utils/jwt.js";

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.jwt;
        if (!token) throw new UnauthorizedError(req._t("auth.unauthorized"));

        const payload = verifyToken(token);
        if (!payload || payload.type !== "super_admin") {
            throw new ForbiddenError(req._t("auth.forbidden"));
        }

        req.superAdmin = { id: payload.id };
        next();
    } catch {
        next(new UnauthorizedError(req._t("auth.unauthorized")));
    }
}