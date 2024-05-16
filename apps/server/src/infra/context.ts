import type { NextFunction, Request, Response } from "express"
import config from "../config"
import { encrypt, decrypt } from "../utils"

declare global {
  namespace Express {
    interface Request {
      context?: import("../shared/contract").Context
    }
    interface Response {
      context?: import("../shared/contract").Context
    }
  }
}

export function contextHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  let context = {}
  if (req.headers.meta?.length > 0) {
    context = JSON.parse(req.headers.meta as string)
  }

  res.context = context
  req.context = context

  next()
}
