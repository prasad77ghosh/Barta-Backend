import jwt from "jsonwebtoken";
import { AccessTokenSecret } from "../configs";

export default class JwtService {
  public generateAccessToken(userData: String) {
    return new Promise((resolve, reject) => {
      const payload = {
        name: "Otp-Service",
        iss: "S-Homes.com",
      };
      const options: jwt.SignOptions = {
        audience: userData as string,
        expiresIn: "1m",
      };
      jwt.sign(payload, AccessTokenSecret, options, (error, token) => {
        if (error) return reject(error);
        return resolve(token);
      });
    });
  }

  public generateRefreshToken(userData: String): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const payload = {
        name: "Otp-Service",
        iss: "S-Homes.com",
      };
      const options: jwt.SignOptions = {
        audience: userData as string,
        expiresIn: "7d",
      };
      jwt.sign(payload, AccessTokenSecret, options, (error, token) => {
        if (error) return reject(error);
        return resolve(token);
      });
    });
  }

  public verifyAccessToken() {}

  public generateAccessTokenByRefreshToken() {}
}
