import { Model, Schema, model } from "mongoose";
import GROUP_MEMBER from "../types/group-member";

const groupMemberSchema = new Schema<GROUP_MEMBER, Model<GROUP_MEMBER>>(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: "ChatGroup",
    },
    member: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const GroupMemberSchema = model<GROUP_MEMBER, Model<GROUP_MEMBER>>(
  "GroupMember",
  groupMemberSchema
);

export default GroupMemberSchema;
