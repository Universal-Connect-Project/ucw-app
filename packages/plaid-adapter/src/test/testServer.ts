import { setupServer } from "msw/node";
import { plaidHandlers } from "@repo/utils-dev-dependency";

export const server = setupServer(...plaidHandlers);
