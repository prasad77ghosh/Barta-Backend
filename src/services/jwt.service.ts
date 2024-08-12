import jwt from "jsonwebtoken";
import { AccessTokenSecret, OtpSecret, RefreshTokenSecret } from "../configs";

export default class JwtService {
  public otpTokenGenerator(userDetails: string): any {
    return new Promise((resolve, reject) => {
      const payload = {
        name: "Otp-Service",
        iss: "S-Homes.com",
      };
      const options = {
        audience: userDetails,
        expiresIn: Math.floor(Date.now() / 1000) + 10 * 60, // 10 minute
      };
      jwt.sign(payload, OtpSecret, options, (error, token) => {
        if (error) return reject(error);
        return resolve(token);
      });
    });
  }

  public generateAccessToken(userData: String): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const payload = {
        name: "Otp-Service",
        iss: "S-Homes.com",
      };
      const options: jwt.SignOptions = {
        audience: userData as string,
        expiresIn: "1h",
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
      jwt.sign(payload, RefreshTokenSecret, options, (error, token) => {
        if (error) return reject(error);
        return resolve(token);
      });
    });
  }

  // otp token verify
  public otpTokenVerify(token: any): any {
    return jwt.verify(token, OtpSecret, (err: any, payload: any): any => {
      if (err) return { error: err };
      return payload;
    });
  }

  //Verify access token
  public accessTokenVerify(token: any): any {
    return jwt.verify(
      token,
      AccessTokenSecret,
      (err: any, payload: any): any => {
        if (err) return { error: err };
        return payload;
      }
    );
  }

  // verify refresh token
  public refreshTokenVerify(token: any): any {
    return jwt.verify(
      token,
      RefreshTokenSecret,
      (err: any, payload: any): any => {
        if (err) return { error: err };
        return payload;
      }
    );
  }

  public generateAccessTokenByRefreshToken(
    token: any
  ): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      try {
        const payload = this.refreshTokenVerify(token);

        if (!payload) {
          reject("Not a valid refresh token");
          return;
        }

        const userObj = JSON.parse(payload?.aud);
        const accessToken = this.generateAccessToken(JSON.stringify(userObj));
        return resolve(accessToken);
      } catch (error) {
        reject(error);
      }
    });
  }
}
