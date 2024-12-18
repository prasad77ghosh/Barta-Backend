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

      const onlineUsers: string[] = Array.from(socketIds.keys());
      io.to(groupId).emit("ONLINE_USERS", onlineUsers);
    }
  );
};

export const leaveRoom = ({
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
  socket.on("LEAVE_ROOM", async ({ groupId, isPrivateGroup, groupName }) => {
    socket.leave(groupId);
    roomMembers.delete(groupId);
    console.log(
      `LEAVE_ROOM------------------->${user?.name} is leave the ${groupName}`
    );
    socket
      .to(groupId)
      .emit("LEAVE_ALERT", `${user?.name} is leave the ${groupName}`);

    const onlineUsers: string[] = Array.from(socketIds.keys());
    io.to(groupId).emit("ONLINE_USERS", onlineUsers);
  });
};

export const startTyping = ({
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
  socket.on("START_TYPING", ({ groupId, userId, name }) => {
    io.to(groupId).emit("START_TYPING", { groupId, userId, name });
  });
};

export const stopTyping = ({
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
  socket.on("STOP_TYPING", ({ groupId, userId, name }) => {
    io.to(groupId).emit("STOP_TYPING", { groupId, userId, name });
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
    async ({
      groupId,
      message,
      type,
      isFirstTime,
      members,
      isFirstMessageOfTheDay,
    }) => {
      const uid = uuid();

      const realTimeMsg = {
        _id: uid,
        type: type,
        content: message,
        chatGroup: groupId,
        attachments: [],
        sender: {
          _id: user?.userId,
          name: user?.name,
          email: user?.email,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFirstMessageOfTheDay,
      };

      io.to(groupId).emit("NEW_MESSAGE", {
        groupId,
        message: realTimeMsg,
      });

      try {
        if (isFirstTime && members) {
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

        const lastMsg = await MessageSchema.create({
          content: message,
          tempId: uid,
          type: "TEXT",
          sender: user?.userId,
          chatGroup: groupId,
          isFirstMessageOfTheDay,
        });

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
