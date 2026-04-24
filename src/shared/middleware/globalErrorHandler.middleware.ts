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
  next: NextFunction,
): void => {
  const status = err.statusCode || 500;
  let message = err.message || "Something went wrong";

  // Try to translate the message if it's an i18n key
  if (req._t && typeof message === "string") {
    const translated = req._t(message);
    // Use translated message only if it's different from the input (meaning it was translated)
    if (translated !== message) {
      message = translated;
    }
  }

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
