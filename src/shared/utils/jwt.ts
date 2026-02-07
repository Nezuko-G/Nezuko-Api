import jwt, { Secret, SignOptions, JwtPayload } from "jsonwebtoken";
import type { Types } from "mongoose";
import type { ROLES } from "./constants.js";

export interface TokenPayload extends JwtPayload {
    name: string;
    email: string;
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
    name: string,
    email: any,
    id: Types.ObjectId,
    role: ROLES | string,
) => {
    const secret: Secret = getJwtSecret() as Secret;

    const expiresIn: any = process.env.JWT_EXPIRES_IN || "3d";

    const options: SignOptions = { expiresIn };

    return jwt.sign({ name, email, id, role }, secret, options);
};


export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, getJwtSecret()) as TokenPayload;

    } catch (error) {
        return null;
    }
};
