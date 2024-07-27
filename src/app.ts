import express, { Application } from "express";
import { DataBase } from "./db";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import SocketServer from "./socket";

class App {
  public app: Application;
  constructor() {
    this.app = express();
    DataBase.connect();
  }

  public listen(serverPort: number) {
    const options = {};
    const server = createServer(options, this.app);
    server.listen(serverPort, (): void => {
      const middlewares = fs.readdirSync(path.join(__dirname, "/middlewares"));
      this.middleware(middlewares, "top.");
      this.routes();
      this.middleware(middlewares, "bottom.");
      console.log(`Listening on ${serverPort}...`);
    });

    // connect socket server
    new SocketServer(server);
  }

  private middleware(middlewares: any[], str: "bottom." | "top.") {
    middlewares.forEach((middleware) => {
      if (middleware.includes(str)) {
        // console.log(path.join(__dirname + "/middlewares/" + middleware));
        import(path.join(__dirname + "/middlewares/" + middleware)).then(
          (middleReader) => {
            // console.log({ middleReader });
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
