import mongoose from "mongoose";
import { DEFAULT_ROLE, ROLES } from "@/shared/utils/constants";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      required: false,
      default: null
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: DEFAULT_ROLE,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      required: false,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);


userSchema.index({ is_deleted: 1, is_active: 1 });

const User = mongoose.model("User", userSchema);

export default User;
