import type { NextFunction, Request, Response } from "express";
import { bookingDemoRequestService } from "./booking-demo-request.service.js";

export const bookingDemoRequestController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await bookingDemoRequestService.create(req.body);

      res.status(201).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
