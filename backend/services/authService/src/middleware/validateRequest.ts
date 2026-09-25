import { NextFunction, Request, Response } from "express";
import CustomError from "../utils/CustomError";
import { Schema } from "joi";

// Middleware function
const validateRequest = (
  schema: Schema,
  source: "body" | "query" | "params" = "body"
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req[source];
    const { error } = schema.validate(dataToValidate);

    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }
    next();
  };
};

export default validateRequest;
