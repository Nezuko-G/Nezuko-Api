import jwt, { Secret, SignOptions, JwtPayload } from "jsonwebtoken";
import type { Types } from "mongoose";
import type { ROLES } from "@/shared/enums/enums.js";

export interface TokenPayload extends JwtPayload {
    id: Types.ObjectId;
    role: ROLES | string;
}

const getJwtSecret = (): string => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }

    return secret;
};

export const generateToken = (
    id: Types.ObjectId,
    role: ROLES | string,
) => {
    const secret: Secret = getJwtSecret() as Secret;

    const expiresIn: any = process.env.JWT_EXPIRES_IN || "7d";

    const options: SignOptions = { expiresIn };

    return jwt.sign({ id, role }, secret, options);
};


export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, getJwtSecret()) as TokenPayload;

    } catch (error) {
        return null;
    }
};
