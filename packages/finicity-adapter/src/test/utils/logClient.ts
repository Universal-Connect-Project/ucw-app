import type { LogClient } from "../../models";

export const logClient: LogClient = {
  debug: console.log,
  info: console.log,
  error: console.log,
  trace: console.log,
  warning: console.log
};
