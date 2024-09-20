import MESSAGE_TYPE, { MSG_TYPE } from "../types/message";

export interface ServerToClientEvents {
  ALERT: (message: string) => void;
  LEAVE_ALERT: (message: string) => void;
  USER_ONLINE: ({
    groupId,
    userId,
  }: {
    groupId: string;
    userId: string;
  }) => void;

  USER_OFFLINE: ({
    groupId,
    userId,
  }: {
    groupId: string;
    userId: string;
  }) => void;

  JOIN_ROOM: ({
    groupId,
    isPrivateGroup,
    groupName,
  }: {
    groupId: string;
    isPrivateGroup: boolean;
    groupName: string;
  }) => void;

  LEAVE_ROOM: ({
    groupId,
    isPrivateGroup,
    groupName,
  }: {
    groupId: string;
    isPrivateGroup: boolean;
    groupName: string;
  }) => void;

  NEW_MESSAGE: ({
    groupId,
    message,
  }: {
    groupId: string;
    message: any;
  }) => void;

  FIRST_TIME_MESSAGE: ({
    groupId,
    message,
  }: {
    groupId: string;
    message: any;
  }) => void;

  NEW_MESSAGE_ALERT: ({ groupId }: { groupId: string }) => void;
}

export interface ClientToServerEvents {
  ALERT: (message: string) => void;
  JOIN_ROOM: ({
    groupId,
    isPrivateGroup,
    groupName,
    members,
  }: {
    groupId: string;
    isPrivateGroup: boolean;
    groupName: string;
    members: string[];
  }) => void;

  LEAVE_ROOM: ({
    groupId,
    isPrivateGroup,
    groupName,
  }: {
    groupId: string;
    isPrivateGroup: boolean;
    groupName: string;
  }) => void;
  NEW_MESSAGE: ({
    groupId,
    type,
    message,
    isFirstTime,
    members,
  }: {
    groupId: string;
    type: MSG_TYPE;
    message: any;
    isFirstTime: boolean;
    members?: string[];
  }) => void;
}
