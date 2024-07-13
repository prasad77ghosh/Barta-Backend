import crypto from "crypto";

export class EncryptAndDecryptService {
  private salt: string;
  private iterations: number;
  private digest: string;
  private keyLength: number;

  constructor() {
    this.salt = crypto.randomBytes(16).toString("hex");
    this.iterations = 100000;
    this.digest = "sha512";
    this.keyLength = 64;
  }

  public async hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        password,
        this.salt,
        this.iterations,
        this.keyLength,
        this.digest,
        (err, derivedKey) => {
          if (err) {
            reject(err);
          } else {
            return resolve(`${this.salt}:${derivedKey.toString("hex")}`);
          }
        }
      );
    });
  }

  public async matchPassword(
    storedHashPassword: string,
    password: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const [salt, originalHash] = storedHashPassword.split(":");
      crypto.pbkdf2(
        password,
        salt,
        this.iterations,
        this.keyLength,
        this.digest,
        (err, derivedKey) => {
          if (err) {
            reject(err);
          } else {
            return resolve(derivedKey.toString("hex") === originalHash);
          }
        }
      );
    });
  }
}
