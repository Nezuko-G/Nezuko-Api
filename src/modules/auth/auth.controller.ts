import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { companyEmail, userEmail, password } = req.body;

      const result = await authService.login(
        companyEmail,
        userEmail,
        password,
        req._t,
        req,
        res
      );

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.logout(res);

      res.status(200).json({
        status: "success",
        message: req._t("auth.logout_success"),
      });
    } catch (error) {
      next(error);
    }
  },
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getMe(req);

      res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};