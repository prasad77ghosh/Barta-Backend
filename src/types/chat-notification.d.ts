import { Document } from "mongoose";

export default interface CHAT_NOTIFICATION extends Document {
  sender: string;
  groupId: string;
  groupName?: string;
  message?: string;
}
