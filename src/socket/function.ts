import { Socket, Server as SocketIOServer } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./event";
import { v4 as uuid } from "uuid";
import { ChatGroupSchema, MessageSchema } from "../models";

export function filterAllGroupMembersWhoAreNotActiveInGroups({
  members,
  roomMembers,
  socketIds,
}: {
  members: string[];
  roomMembers: any;
  socketIds: any;
}) {
  const allRoomMembers = Array.from(roomMembers.values());
  const allInActiveRoomMembers = members.filter(
    (member) => !allRoomMembers.includes(member)
  );
  const filteredSocketIds = allInActiveRoomMembers
    .map((key) => socketIds.get(key))
    .filter(Boolean);

  return filteredSocketIds;
}

export const joinRoom = ({
  socket,
  user,
  io,
  roomMembers,
  socketIds,
}: {
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
  user: any;
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  roomMembers: any;
  socketIds: any;
}) => {
  socket.on(
    "JOIN_ROOM",
    async ({ groupId, isPrivateGroup, groupName, members }) => {
      socket.join(groupId);
      roomMembers.set(groupId, user?.userId);
      socket
        .to(groupId)
        .emit("ALERT", `${user?.name} is active in ${groupName}`);

      //filter all the members who are not active in the group
      const filteredSocketIds = filterAllGroupMembersWhoAreNotActiveInGroups({
        members,
        socketIds,
        roomMembers,
      });
      socket
        .to(filteredSocketIds)
        .emit("ALERT", `${user?.name} is active in ${groupName}`);
    }
  );
};

export const leaveRoom = ({
  socket,
  user,
  io,
}: {
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
  user: any;
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
}) => {
  socket.on("LEAVE_ROOM", async ({ groupId, isPrivateGroup, groupName }) => {
    socket.leave(groupId);
    socket
      .to(groupId)
      .emit("LEAVE_ALERT", `${user?.name} is leave the ${groupName}`);
  });
};

export const sendMessage = ({
  io,
  user,
  socket,
  roomMembers,
  socketIds,
}: {
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  user: any;
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
  roomMembers: any;
  socketIds: any;
}) => {
  socket.on(
    "NEW_MESSAGE",
    async ({ groupId, message, type, isFirstTime, members }) => {
      const realTimeMsg = {
        _id: uuid(),
        type: type,
        content: message,
        chatGroup: groupId,
        sender: {
          _id: user?.userId,
          name: user?.name,
        },
        createdAt: new Date().toISOString(),
      };

      io.to(groupId).emit("NEW_MESSAGE", {
        groupId,
        message: realTimeMsg,
      });

      try {
        const lastMsg = await MessageSchema.create({
          content: message,
          type: "TEXT",
          sender: user?.userId,
          chatGroup: groupId,
        });

        if (isFirstTime && members) {
          console.log("COMING In side ...............>>>>>>>>>>");
          const filteredSocketIds =
            filterAllGroupMembersWhoAreNotActiveInGroups({
              members,
              roomMembers,
              socketIds,
            });

          socket.to(filteredSocketIds).emit("FIRST_TIME_MESSAGE", {
            groupId,
            message: realTimeMsg,
          });
        }

        if (lastMsg) {
          await ChatGroupSchema.findByIdAndUpdate(groupId, {
            updatedAt: new Date(),
            lastMsg: lastMsg._id,
            isMessaged: true,
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  );
};
