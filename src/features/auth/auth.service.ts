import { BadRequestError } from "@/shared/errors/errors";
import { hashPassword, comparePassword } from "@/shared/utils/hash";
import { generateToken } from "@/shared/utils/jwt.js";
import { authRepository } from "./auth.repository";

function cleanUser(user: any) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  delete obj.is_deleted;
  delete obj.is_active;
  return obj;
}

export const authService = {
  async signUp(data: any, t: any) {
    const { name, email, password, bio, avatar } = data;

    if (!email || !name || !password) {
      throw new BadRequestError(t("validation.all_fields_required"));
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await authRepository.findByEmail(normalizedEmail);

    if (existingUser && !existingUser.is_deleted && existingUser.is_active) {
      throw new BadRequestError(t("validation.email_in_use"));
    }

    if (existingUser && existingUser.is_deleted) {
      throw new BadRequestError(t("validation.email_reactivate"));
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await authRepository.createUser({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      bio,
      avatar,
    });

    const token = generateToken(
      newUser.name,
      newUser.email,
      newUser._id,
      newUser.role,
    );

    return {
      user: cleanUser(newUser),
      token,
    };
  },

  async login(data: any, t: any) {
    const { email, password } = data;

    if (!email || !password) {
      throw new BadRequestError(t("validation.all_fields_required"));
    }

    const user = await authRepository.findByEmail(email.toLowerCase());

    if (!user) {
      throw new BadRequestError(t("auth.invalid_credentials"));
    }

    if (user.is_deleted) {
      throw new BadRequestError(t("auth.user_deleted"));
    }

    if (!user.is_active) {
      throw new BadRequestError(t("auth.user_not_active"));
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new BadRequestError(t("auth.invalid_credentials"));
    }

    const token = generateToken(
      user.name,
      user.email,
      user._id,
      user.role,
    );

    return {
      user: cleanUser(user),
      token,
    };
  },
};
