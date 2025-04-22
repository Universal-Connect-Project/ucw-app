import type { LogClient } from "../adapterTypes";

export const createLogClient = (): LogClient => {
  return {
    debug: () => {},
    info: () => {},
    error: () => {},
    trace: () => {},
    warning: () => {},
  };
};
