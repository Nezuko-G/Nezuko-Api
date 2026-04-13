import jwt, { Secret, JwtPayload } from "jsonwebtoken";
import { UserRole } from "@prisma/client";

export interface TokenPayload extends JwtPayload {
  userId: string;
  tenantId?: string;
  role: UserRole | "SUPER_ADMIN";
  type: "user" | "super_admin";
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return secret;
};

export const generateToken = (
  userId: string,
  role: UserRole | "SUPER_ADMIN",
  type: "user" | "super_admin",
  tenantId?: string
): string => {
  const secret: Secret = getJwtSecret();
  const expiresIn: any = process.env.JWT_EXPIRES_IN || "7d";
  const payload: Omit<TokenPayload, keyof JwtPayload> = {
    userId,
    role,
    type,
    ...(tenantId && { tenantId }),
  };
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, getJwtSecret()) as TokenPayload;
  } catch {
    return null;
  }
};