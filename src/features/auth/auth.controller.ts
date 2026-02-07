import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service";

export const authController = {
  async signUp(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await authService.signUp(
        req.body,
        res._t,
      );

      res.status(201).json({
        message: res._t("auth.user_registered"),
        data: user,
        token,
      });
    } catch (error) {
      next(error);
    }
  },


  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, token } = await authService.login(
        req.body,
        res._t,
      );

      res.status(200).json({
        message: res._t("auth.login_successful"),
        data: user,
        token,
      });
    } catch (error) {
      next(error);
    }
  },


  // async logout(req: Request, res: Response) {
  //   res.clearCookie("token");
  //   res.status(200).json({
  //     message: res._t("auth.logout_success"),
  //   });
  // },
};
