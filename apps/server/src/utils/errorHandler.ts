import {
  SOMETHING_WENT_WRONG_ERROR_TEXT,
  USER_NOT_RESOLVED_ERROR_TEXT,
} from "@repo/utils";
import type { Response } from "express";

interface CustomError extends Error {
  status?: number;
  cause?: {
    statusCode?: number;
  };
}

export default function handleError({
  error,
  res,
}: {
  error: CustomError;
  res: Response;
}) {
  let statusCode: number;
  let message: string;

  if (error.message === USER_NOT_RESOLVED_ERROR_TEXT) {
    statusCode = 404;
    message = USER_NOT_RESOLVED_ERROR_TEXT;
  } else if (error.message) {
    statusCode = error.status || error.cause?.statusCode || 400;
    message = error.message;
  } else {
    statusCode = 400;
    message = SOMETHING_WENT_WRONG_ERROR_TEXT;
  }
  res.status(statusCode).json({
    message,
  });
}
