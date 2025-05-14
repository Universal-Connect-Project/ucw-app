import { setupServer } from "msw/node";
import { sophtronHandlers } from "@repo/utils-dev-dependency";

export const server = setupServer(...sophtronHandlers);
