import { logger } from "./logger.js";
import type { Request, Response, NextFunction } from "express";

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
};

export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    success: false,
    error: "Not found",
  });
};

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info(`${req.method} ${req.url}`);
  next();
};