import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
interface CustomeRequest extends Request {
  user?: string | JwtPayload;
}

export interface IAuthController {
  signup(req: Request, res: Response, next: NextFunction): Promise<void>;
  verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
  resendOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
  signin(req: Request, res: Response, next: NextFunction): Promise<void>;
  verifyLoginOtp(req: Request, res: Response, next: NextFunction): Promise<void>;
  googleLogin(req: Request, res: Response, next: NextFunction): Promise<void>;
  forgetPassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  resetPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
  changePassword(
    req: CustomeRequest,
    res: Response,
    next: NextFunction
  ): Promise<void>;
  logout(req: CustomeRequest, res: Response, next: NextFunction): Promise<any>;
}
