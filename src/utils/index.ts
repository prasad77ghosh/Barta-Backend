export function generateOtp(): string {
  const randomNumber = Math.floor(Math.random() * 10000);
  const otp = randomNumber.toString().padStart(4, "0");
  return otp;
}

export function generateSlugName(name: string): string {
  let randomNumber = Math.floor(Math.random() * 9000) + 1000;
  let slug = name.replace(/\s+/g, "_") + "_" + randomNumber;
  return slug.toLowerCase();
}
