import { BadRequestError } from "@/shared/errors/errors";
import { hashPassword, comparePassword } from "@/shared/utils/hash";
import { generateToken } from "@/shared/utils/jwt.js";
import { authRepository } from "./auth.repository";

function cleanUser(user: any) {
  if (!user) return null;
  const { password, isDeleted, isActive, ...cleanedUser } = user;
  return cleanedUser;
}

export const authService = {
  async signUp(data: any, t: any) {
    const { name, email, password, bio, avatar } = data;

    if (!email || !name || !password) {
      throw new BadRequestError(t("validation.all_fields_required"));
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await authRepository.findByEmail(normalizedEmail);

    if (existingUser && !existingUser.isDeleted && existingUser.isActive) {
      throw new BadRequestError(t("validation.email_in_use"));
    }

    if (existingUser && existingUser.isDeleted) {
      throw new BadRequestError(t("validation.email_reactivate"));
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await authRepository.createUser({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      bio: bio || null,
      avatar: avatar || null,
    });

    const token = generateToken(
      newUser.name,
      newUser.email,
      newUser.id.toString(),
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

    if (user.isDeleted) {
      throw new BadRequestError(t("auth.user_deleted"));
    }

    if (!user.isActive) {
      throw new BadRequestError(t("auth.user_not_active"));
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new BadRequestError(t("auth.invalid_credentials"));
    }

    const token = generateToken(
      user.name,
      user.email,
      user.id.toString(),
      user.role,
    );

    return {
      user: cleanUser(user),
      token,
    };
  },
};
