import type { LogClient } from "../adapterTypes";

export const createLogClient = (): LogClient => {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    trace: jest.fn(),
    warning: jest.fn(),
  };
};
