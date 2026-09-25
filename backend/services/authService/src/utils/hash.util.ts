import bcrypt from "bcryptjs";

export const generateRandomPassword = (): string => {
  return Math.random().toString(36).slice(-8);
};

export const hashPassword = async (password: string) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};
