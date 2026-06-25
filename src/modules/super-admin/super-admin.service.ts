import { superAdminRepository } from "./super-admin.repository.js";
import { comparePassword } from "@/shared/utils/hash.js";
import { generateToken } from "@/shared/utils/jwt.js";
import { setCookieToken } from "@/shared/utils/helpers.js";
import { UnauthorizedError } from "@/shared/errors/errors.js";
import type { Request, Response } from "express";

export const superAdminAuthService = {
    async login(email: string, password: string, req: Request, res: Response) {

        const t = req._t;

        const admin = await superAdminRepository.findByEmail(email);

        const isValid = admin ? await comparePassword(password, admin.passwordHash) : false;

        if (!admin || !isValid) throw new UnauthorizedError(t("auth.invalid_credentials"));
        if (!admin.isActive) throw new UnauthorizedError(t("auth.account_inactive"));

        const token = generateToken(admin.id, "SUPER_ADMIN", "super_admin");

        setCookieToken(res, token, req);

        return {
            id: admin.id,
            email: admin.email,
            name: admin.name,
        };
    },

    async logout(res: Response) {
        res.clearCookie("jwt");
    },
};