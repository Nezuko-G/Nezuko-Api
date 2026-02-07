import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
  statusCode?: number;
  data?: any;
}

interface ErrorResponse {
  status: number;
  message: string;
  errors?: any;
}

const globalErrorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const status = err.statusCode || 500;
  const message = err.message || "Something went wrong";

  const errorResponse: ErrorResponse = {
    status,
    message,
  };

  if (err.data) {
    errorResponse.errors = err.data;
  }

  res.status(status).json(errorResponse);
};

export default globalErrorHandler;