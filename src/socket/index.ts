import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import express, { Application } from "express";

// interfaces
interface ServerToClientEvents {
  ALERT: () => void;
}

interface ClientToServerEvents {
  ALERT: () => void;
}

class SocketServer {
  private io: SocketIOServer<ServerToClientEvents, ClientToServerEvents>;
  private app: Application;

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
      },
    });
    this.app = express();
    this.app.set("io", this.io);
    this.io.on("connection", this.onConnection);
  }

  private onConnection = (
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
  ) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  };
}

export default SocketServer;
