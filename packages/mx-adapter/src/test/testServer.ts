import { setupServer } from "msw/node";
import { mxHandlers } from "@repo/utils-dev-dependency";

export const server = setupServer(...mxHandlers);
