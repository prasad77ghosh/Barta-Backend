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
        expiresIn: Math.floor(Date.now() / 1000) + 1 * 60, // 1 minute
      };
      jwt.sign(payload, AccessTokenSecret, options, (error, token) => {
        if (error) return reject(error);
        return resolve(token);
      });
    });
  }

  public generateRefreshToken(userData: String) {}

  public verifyAccessToken() {}

  public generateAccessTokenByRefreshToken() {}
}
