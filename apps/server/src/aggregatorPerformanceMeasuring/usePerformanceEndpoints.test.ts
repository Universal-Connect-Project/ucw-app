import type { Application } from "express";
import usePerformanceEndpoints from "./usePerformanceEndpoints";

describe("usePerformanceEndpoints", () => {
  it("sets up handlers", () => {
    const app = {
      post: jest.fn(),
    };

    usePerformanceEndpoints(app as unknown as Application);

    expect(app.post).toHaveBeenCalledTimes(1);
  });
});
