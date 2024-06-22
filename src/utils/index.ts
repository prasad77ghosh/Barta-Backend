export const generateOtp = () => {
  let randomNumber = Math.floor(Math.random() * 9000) + 1000;
  return randomNumber;
};
