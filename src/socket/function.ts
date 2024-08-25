import { Socket, Server as SocketIOServer } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "./event";

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
