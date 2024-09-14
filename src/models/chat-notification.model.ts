import { model, Model, Schema } from "mongoose";
import CHAT_NOTIFICATION from "../types/chat-notification";

const chatNotificationSchema = new Schema<
  CHAT_NOTIFICATION,
  Model<CHAT_NOTIFICATION>
>(
  {
    sender: {
      type: String,
    },
    groupId: {
      type: String,
    },
    groupName: {
      type: String,
    },
    message: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const ChatNotificationSchema = model<
  CHAT_NOTIFICATION,
  Model<CHAT_NOTIFICATION>
>("ChatNotification", chatNotificationSchema);

export default ChatNotificationSchema;
