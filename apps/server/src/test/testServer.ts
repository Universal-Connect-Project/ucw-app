import { setupServer } from "msw/node";
import handlers from "./handlers";
import { mxHandlers, sophtronHandlers } from "@repo/utils-dev-dependency";

export const server = setupServer(
  ...handlers,
  ...mxHandlers,
  ...sophtronHandlers,
);
