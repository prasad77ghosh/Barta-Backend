import App from "./app";
import { port } from "./configs";
const app = new App();

app.listen(port);

// import { EncryptAndDecryptService } from "./services/hash.service";
// (async () => {
//   const Service = await new EncryptAndDecryptService();
//   const data = await Service.hashPassword("1234");
//   const res = await Service.matchPassword(data, "1234");
//   console.log({ res });
// })();
