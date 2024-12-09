import type { Express } from "express";
import * as config from "../config";
import useUserEndpoints from "./useUserEndpoints";

describe("useUserEndpoints", () => {
  it("attaches the user delete endpoint if ENV var is enabled", () => {
    const app = {
      delete: jest.fn(),
    } as unknown as Express;

    jest.spyOn(config, "getConfig").mockReturnValue({
      USER_DELETE_ENDPOINT_ENABLE: "true",
    });

    useUserEndpoints(app);

    expect(app.delete).toHaveBeenCalledTimes(1);
  });

  it("doesn't attach anything if the ENV var isn't enabled", () => {
    const app = {
      delete: jest.fn(),
    } as unknown as Express;

    jest.spyOn(config, "getConfig").mockReturnValue({
      USER_DELETE_ENDPOINT_ENABLE: "false",
    });

    useUserEndpoints(app);

    expect(app.delete).not.toHaveBeenCalled();
  });
});
