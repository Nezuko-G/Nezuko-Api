import { comparePassword } from "@/shared/utils/hash.js";
import { authRepository } from "./auth.repository.js";
import { generateToken } from "@/shared/utils/jwt.js";
import { setCookieToken } from "@/shared/utils/helpers.js";
import { NotFoundError, UnauthorizedError } from "@/shared/errors/errors.js";
import type { Request, Response } from "express";

function cleanUser(user: any) {
    if (!user) return null;
    const obj = { ...user };
    delete obj.passwordHash;
    delete obj.isActive;
    return obj;
}

export const authService = {
    async login(
        companyEmail: string,
        userEmail: string,
        password: string,
        t: any,
        req: Request,
        res: Response
    ) {
        const tenant = await authRepository.findTenantByCompanyEmail(companyEmail);

        if (!tenant) throw new UnauthorizedError(t("auth.invalid_credentials"));

        const user = await authRepository.findUserByEmailAndTenant(userEmail, tenant.id);

        if (!user) throw new UnauthorizedError(t("auth.invalid_credentials"));

        const isValid = await comparePassword(password, user.passwordHash);

        if (!isValid) throw new UnauthorizedError(t("auth.invalid_credentials"));

        const token = generateToken(user.id, user.role, "user", tenant.id);

        setCookieToken(res, token, req);

        return {
            user: cleanUser({ ...user, tenantName: tenant.name }),
        };
    },

    async logout(res: Response) {
        res.clearCookie("jwt");
    },
    async getMe(req: Request) {
        const userId = req.user?.id;
        if (!userId) throw new UnauthorizedError(req._t("auth.unauthorized"));

        const user = await authRepository.findUserById(userId);
        if (!user) throw new NotFoundError(req._t("auth.user_not_found"));

        return user;
    },
    
};