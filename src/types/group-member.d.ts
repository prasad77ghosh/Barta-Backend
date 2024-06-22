import { Document } from "mongoose";
import CHAT_GROUP_TYPE from "./chat-group";
import USER_TYPE from "./user";

export default interface GROUP_MEMBER extends Document {
  group: CHAT_GROUP_TYPE;
  member: USER_TYPE;
  isBlocked: boolean;
}
