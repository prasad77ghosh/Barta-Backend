import { Document } from "mongoose";
import USER_TYPE from "./user";
import CHAT_GROUP_TYPE from "./chat-group";
export type ATTACHMENT_TYPE = {
  profileUrl: string;
  profilePath: string;
};

export type MSG_TYPE =
  | "IMAGE"
  | "TEXT"
  | "VIDEO"
  | "AUDIO"
  | "DOCUMENT"
  | "HOUSE"
  | "LINK"
  | "CODE";
export default interface MESSAGE_TYPE extends Document {
  content: string;
  attachments: ATTACHMENT_TYPE[];
  sender: USER_TYPE;
  chatGroup: CHAT_GROUP_TYPE;
  type: MSG_TYPE;
  isReplyMsg: boolean;
  parentMessage: MESSAGE_TYPE;
}
