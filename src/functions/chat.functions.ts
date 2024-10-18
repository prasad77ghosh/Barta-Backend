import App from "../app";
import SocketServer from "../socket";

export function getSocketInfo() {
  const server = App.server;
  const instance = SocketServer.getInstance(server);
  const io = instance.getIO();
  const socketIds = instance.getSocketIds();
  const roomMembers = instance.getRoomMembers();
  const socket = instance.getSocket();
  return { io, socketIds, roomMembers, socket };
}
