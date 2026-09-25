import { Response } from "express";

export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string,
  role: string
) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // sameSite: 'none',
    // path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
