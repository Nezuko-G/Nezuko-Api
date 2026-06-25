import { comparePassword } from "@/shared/utils/hash.js";
import { authRepository } from "./auth.repository.js";
import { generateToken } from "@/shared/utils/jwt.js";
import { setCookieToken } from "@/shared/utils/helpers.js";
import { NotFoundError, UnauthorizedError } from "@/shared/errors/errors.js";
import type { Request, Response } from "express";
import cloudinary from "@/shared/config/cloudinary.js";
import { cleanUser } from "./auth.helpers.js";


export const authService = {
    async login(
        companyEmail: string,
        userEmail: string,
        password: string,
        req: Request,
        res: Response
    ) {
        const t = req._t;

        const tenant = await authRepository.findTenantByCompanyEmail(companyEmail);

        const user = tenant
            ? await authRepository.findUserByEmailAndTenant(userEmail, tenant.id)
            : null;

        const isValid = user ? await comparePassword(password, user.passwordHash) : false;

        if (!tenant || !user || !isValid) {
            throw new UnauthorizedError(t("auth.invalid_credentials"));
        }

        if (!tenant.isActive) {
            throw new UnauthorizedError(t("auth.tenant_inactive"));
        }

        if (!user.isActive || user.status === "TERMINATED") {
            throw new UnauthorizedError(t("auth.account_inactive"));
        }

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

    async updateAvatar(userId: string, file: Express.Multer.File): Promise<string> {
        const avatarUrl = await new Promise<string>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "avatars",
                    public_id: `user_${userId}`,
                    overwrite: true,
                    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
                },
                (error, result) => {
                    if (error || !result) return reject(error ?? new Error("Upload failed"));
                    resolve(result.secure_url);
                }
            );
            stream.end(file.buffer);
        });

        await authRepository.updateAvatar(userId, avatarUrl);
        return avatarUrl;
    },

};