import { Model, Schema, model } from "mongoose";
import USER_TYPE from "../types/user";

const userSchema = new Schema<USER_TYPE, Model<USER_TYPE>>(
  {
    role: {
      type: String,
      enum: {
        values: ["CUSTOMER", "ADMIN", "EMPLOYEE", "SUPER_ADMIN", "USER"],
        message:
          "Role must be a CUSTOMER, ADMIN, EMPLOYEE,  SUPER_ADMIN and USER ",
      },
      default: "USER",
    },
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      trim: true,
    },
    googleId: {
      type: String,
      // unique: true,
      trim: true,
    },
    refreshToken: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    countryCode: {
      type: String,
      default: "+91",
    },
    otpExpire: {
      type: Number,
    },
    password: {
      type: String,
      trim: true,
      select: false,
    },
    hashOtp: {
      type: String,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    profilePath: {
      type: String,
    },
    profileUrl: {
      type: String,
    },
    slugName: {
      type: String,
      trim: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    chatGroups: [
      {
        type: Schema.Types.ObjectId,
        ref: "ChatGroup",
      },
    ],
    fcmToken: {
      android: {
        type: String,
      },
      ios: {
        type: String,
      },
      web: {
        type: String,
      },
    },
  },
  {
    timestamps: true,
  }
);

const UserSchema = model<USER_TYPE, Model<USER_TYPE>>("User", userSchema);

export default UserSchema;
