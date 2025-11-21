import type { NextFunction, Request, Response } from "express";
import type { Context } from "../shared/contract";

declare global {
  namespace Express {
    interface Request {
      context?: Context;
    }
    interface Response {
      context?: Context;
    }
  }
}

export function contextHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let context = {} as Context;
  if (req.headers.meta?.length > 0) {
    context = JSON.parse(req.headers.meta as string);
  }

  res.context = context;
  req.context = context;

  const { json } = res;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.json = function (...args: any): any {
    res.json = json;

    res.set("meta", JSON.stringify(res.context));

    json.apply(res, args);
  };

  next();
}
