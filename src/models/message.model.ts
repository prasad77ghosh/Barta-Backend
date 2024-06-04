import { Model, Schema, model } from "mongoose";
import MESSAGE_TYPE from "../types/message";

const messageSchema = new Schema<MESSAGE_TYPE, Model<MESSAGE_TYPE>>(
  {
    content: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        profileUrl: {
          type: String,
        },
        profilePath: {
          type: String,
        },
      },
    ],
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    chatGroup: {
      type: Schema.Types.ObjectId,
      ref: "ChatGroup",
    },
  },
  {
    timestamps: true,
  }
);

const MessageSchema = model<MESSAGE_TYPE, Model<MESSAGE_TYPE>>(
  "Message",
  messageSchema
);
export default MessageSchema;
