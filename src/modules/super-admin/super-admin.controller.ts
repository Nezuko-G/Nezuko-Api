import type { NextFunction, Request, Response } from "express";
import { superAdminAuthService } from "./super-admin.service";

export const superAdminAuthController = {
    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, password } = req.body;
            const result = await superAdminAuthService.login(email, password, req, res);
            res.status(200).json({ status: "success", data: result });
        } catch (error) {
            next(error);
        }
    },

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            await superAdminAuthService.logout(res);
            res.status(200).json({ status: "success" });
        } catch (error) {
            next(error);
        }
    },
};