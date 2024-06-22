import crypto from "crypto";

class EncryptAndDecryptService {
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
  public hashPassword(password: string): string {
    const hash = crypto
      .pbkdf2Sync(
        password,
        this.salt,
        this.iterations,
        this.keyLength,
        this.digest
      )
      .toString("hex");
    return `${this.salt}:${hash}`;
  }

  public matchPassword(storedHashPassword: string, password: string): boolean {
    const [salt, originalHash] = storedHashPassword.split(":");
    const hash = crypto
      .pbkdf2Sync(password, salt, this.iterations, this.keyLength, this.digest)
      .toString("hex");
    return hash === originalHash;
  }
}

export const HashService = new EncryptAndDecryptService();
