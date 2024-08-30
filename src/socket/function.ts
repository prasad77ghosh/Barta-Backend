import { Socket, Server as SocketIOServer } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./event";
import { v4 as uuid } from "uuid";
import { MessageSchema } from "../models";

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
      await MessageSchema.create({
        content: message,
        type: "TEXT",
        sender: user?.userId,
        chatGroup: groupId,
      });
    } catch (error) {
      console.log(error);
    }
  });
};
