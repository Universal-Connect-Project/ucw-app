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

function get(req: Request) {
  if (req.headers.meta?.length > 0) {
    req.context = JSON.parse(req.headers.meta as string)
    req.context.updated = false
  } else {
    req.context = {}
  }
  return req.context
}

function set(res: Response) {
  if (res.context.updated) {
    res.set("meta", JSON.stringify(res.context))
  }
}

export function contextHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.context = get(req)

  const { send } = res
  res.send = function (...args: any): any {
    res.send = send
    set(res)
    send.apply(res, args)
  }
  next()
}
