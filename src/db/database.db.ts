import mongoose from "mongoose";
import { DbUrl } from "../configs";

class DataBase {
  private static uri: string = DbUrl;
  public static connect() {
    mongoose.set("strictQuery", true);
    mongoose
      .connect(this.uri)
      .then(() => {
        console.log("DB Connected Successfully..");
      })
      .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
      });
  }
  public static disConnect() {
    mongoose
      .disconnect()
      .then(() => {
        console.log("DB DisConnected Successfully..");
      })
      .catch((error) => {
        console.error("Error disConnecting to MongoDB:", error);
      });
  }
}

export default DataBase;
