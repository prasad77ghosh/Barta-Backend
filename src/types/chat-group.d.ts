import { Document } from "mongoose";
import USER_TYPE from "./user";
export type PROFILE_TYPE = {
  profileUrl: string;
  profilePath: string;
};
export default interface CHAT_GROUP_TYPE extends Document {
  name: string;
  isGroupChat: boolean;
  admin: USER_TYPE;
  members: USER_TYPE[];
  profile: PROFILE_TYPE;
}
