import type { LogClient } from "@repo/utils/adapterTypes";

export const createLogClient = (): LogClient => {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
    warning: jest.fn(),
  };
};
