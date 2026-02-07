import { Request, Response, NextFunction } from 'express';
import {
    NotFoundError,
} from "@/shared/errors/errors";


export const notFoundMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    next(new NotFoundError(`Route ${req.originalUrl} not found`));
};