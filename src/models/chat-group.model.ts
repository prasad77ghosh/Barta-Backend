import { Model, Schema, model } from "mongoose";
import CHAT_GROUP_TYPE from "../types/chat-group";

const chatGroupSchema = new Schema<CHAT_GROUP_TYPE, Model<CHAT_GROUP_TYPE>>(
  {
    name: {
      type: String,
      trim: true,
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    profile: {
      profilePath: {
        type: String,
      },
      profileUrl: {
        type: String,
      },
    },

    admin: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
<<<<<<< HEAD
=======
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
>>>>>>> 86bded18258d0434edd58980058d0893fa6c35e2
  },
  {
    timestamps: true,
  }
);

const ChatGroupSchema = model<CHAT_GROUP_TYPE, Model<CHAT_GROUP_TYPE>>(
  "ChatGroup",
  chatGroupSchema
);
export default ChatGroupSchema;
