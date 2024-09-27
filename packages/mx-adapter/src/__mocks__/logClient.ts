import type { LogClient } from "../models";

// export const logClient: LogClient = {
//   debug: console.debug,
//   info: console.info,
//   error: console.error,
//   trace: console.log,
//   warning: console.warn
// };
export const logClient: LogClient = {
  debug: () => {},
  info: () => {},
  error: () => {},
  trace: () => {},
  warning: () => {}
};