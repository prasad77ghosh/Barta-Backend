import express, { Application } from "express";
import { DataBase } from "./db";
import { createServer, Server } from "http";
import path from "path";
import fs from "fs";
import SocketServer from "./socket";

class App {
  public app: Application;
  public static server: Server; // Static property to hold the server instance

  constructor() {
    this.app = express();
    DataBase.connect();
  }

  public listen(serverPort: number) {
    const options = {};
    App.server = createServer(options, this.app); // Assign the server instance to the static property
    App.server.listen(serverPort, (): void => {
      const middlewares = fs.readdirSync(path.join(__dirname, "/middlewares"));
      this.middleware(middlewares, "top.");
      this.routes();
      this.middleware(middlewares, "bottom.");
      console.log(`Listening on ${serverPort}...`);
    });

    // Connect socket server
    SocketServer.getInstance(App.server);
  }

  private middleware(middlewares: any[], str: "bottom." | "top.") {
    middlewares.forEach((middleware) => {
      if (middleware.includes(str)) {
        import(path.join(__dirname + "/middlewares/" + middleware)).then(
          (middleReader) => {
            new middleReader.default(this.app);
          }
        );
      }
    });
  }

  private routes() {
    const subRoutes = fs.readdirSync(path.join(__dirname, "/routes"));
    subRoutes.forEach((file: any): void => {
      if (file.includes(".routes.")) {
        import(path.join(__dirname + "/routes/" + file)).then((route) => {
          const rootPath = `/api/v1/${new route.default().path}`;
          this.app.use(rootPath, new route.default().router);
        });
      }
    });
  }
}

export default App;
