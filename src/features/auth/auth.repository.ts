import User from "./auth.model.js";

export const authRepository = {
  async findByEmail(email: string) {
    return await User.findOne({ email });
  },

  async findActiveUserByEmail(email: string) {
    return await User.findOne({
      email,
      is_deleted: false,
      is_active: true,
    });
  },

  async findDeletedUserByEmail(email: string) {
    return await User.findOne({
      email,
      is_deleted: true,
    });
  },

  async createUser(data: any) {
    const user = new User({
      ...data,
      is_deleted: false,
      is_active: true,
    });
    return await user.save();
  },

  async reactivateUserById(id: string) {
    return await User.findByIdAndUpdate(
      id,
      { is_deleted: false, is_active: true },
      { new: true },
    );
  },

  async updateUserById(id: string, data: Partial<any>) {
    return await User.findByIdAndUpdate(id, data, { new: true });
  },
};
