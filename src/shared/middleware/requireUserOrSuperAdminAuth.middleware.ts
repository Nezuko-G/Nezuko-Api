import type { Request, Response, NextFunction } from "express";
import { requireAuth } from "./auth.middleware.js";
import { requireSuperAdmin } from "./super-admin.middleware.js";

/**
 * Middleware that allows either a tenant user (Employee/Manager/Owner)
 * or a super admin.
 */
export const requireUserOrSuperAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, (err) => {
    if (!err) {
      return next();
    }
    // If requireAuth fails, try requireSuperAdmin
    requireSuperAdmin(req, res, (err2) => {
      if (!err2) {
        return next();
      }
      next(err);
    });
  });
};
