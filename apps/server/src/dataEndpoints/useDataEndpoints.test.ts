import type { Express } from "express";
import * as config from "../config";
import useDataEndpoints from "./useDataEndpoints";

describe("useDataEndpoints", () => {
  it("attaches the data endpoints if data endpoints is enabled", () => {
    const app = {
      get: jest.fn(),
    } as unknown as Express;

    jest.spyOn(config, "getConfig").mockReturnValue({
      DATA_ENDPOINTS_ENABLE: "true",
    });

    useDataEndpoints(app);

    expect(app.get).toHaveBeenCalledTimes(6);
  });

  it("doesn't attach anything if data endpoints aren't enabled", () => {
    const app = {
      get: jest.fn(),
    } as unknown as Express;

    jest.spyOn(config, "getConfig").mockReturnValue({
      DATA_ENDPOINTS_ENABLE: "false",
    });

    useDataEndpoints(app);

    expect(app.get).not.toHaveBeenCalled();
  });
});
