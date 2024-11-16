import { Model, Schema, model } from "mongoose";
import MESSAGE_TYPE from "../types/message";

const messageSchema = new Schema<MESSAGE_TYPE, Model<MESSAGE_TYPE>>(
  {
    content: {
      type: String,
      trim: true,
    },
    tempId: {
      type: String,
      trim: true,
      unique: true,
    },
    link: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        mediaPath: {
          type: String,
        },
        mediaUrl: {
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
    parentMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    isReplyMsg: {
      type: Boolean,
      default: false,
    },
    isFirstMessageOfTheDay: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: {
        values: [
          "IMAGE",
          "TEXT",
          "VIDEO",
          "AUDIO",
          "DOCUMENT",
          "HOUSE",
          "LINK",
          "CODE",
        ],
        message:
          "Type must be IMAGE,TEXT,VIDEO, AUDIO,DOCUMENT,HOUSE,LINK,CODE",
      },

      default: "TEXT",
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
