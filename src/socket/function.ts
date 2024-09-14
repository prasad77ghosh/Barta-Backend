import { Socket, Server as SocketIOServer } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./event";
import { v4 as uuid } from "uuid";
import { ChatGroupSchema, MessageSchema } from "../models";

export const joinRoom = ({
  socket,
  user,
  io,
}: {
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
  user: any;
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
}) => {
  socket.on("JOIN_ROOM", async ({ groupId, isPrivateGroup, groupName }) => {
    socket.join(groupId);
    io.to(groupId).emit("ALERT", `${user?.name} is active in ${groupName}`);
  });
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
    io.to(groupId).emit("ALERT", `${user?.name} is leave the ${groupName}`);
  });
};

export const sendMessage = ({
  io,
  user,
  socket,
}: {
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  user: any;
  socket: Socket<ClientToServerEvents, ServerToClientEvents>;
}) => {
  socket.on("NEW_MESSAGE", async ({ groupId, message, type }) => {
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
  });
};
