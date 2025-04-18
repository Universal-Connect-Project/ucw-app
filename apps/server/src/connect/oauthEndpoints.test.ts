/* eslint-disable @typescript-eslint/no-explicit-any */
import { set } from "../services/storageClient/redis";
import type { Request } from "express";
import { ConnectApi } from "./connectApi";
import { webhookHandler, oauthRedirectHandler } from "./oauthEndpoints";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../test-adapter";
import { ConnectionStatus } from "@repo/utils";

const context = {
  aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
};
let connect: ConnectApi;

describe("oauthHandler", () => {
  beforeEach(async () => {
    connect = new ConnectApi({
      context,
    });
    await connect.init();
  });

  it("responds with the success page from oauthRedirectHandler", async () => {
    const req = {
      connectApi: connect,
      params: {
        userId: "userId",
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
      },
      query: {},
    } as unknown as Request;

    const res = {
      send: jest.fn(),
      status: jest.fn(),
    } as unknown as any;

    await oauthRedirectHandler(req, res);
    const htmlResponse = res.send.mock.calls[0][0].toString();

    expect(htmlResponse.includes("Thank you for completing OAuth")).toBe(true);
    expect(htmlResponse.includes("OAuth Complete")).toBe(true);
  });

  it("responds with the error page from oauthRedirectHandler", async () => {
    const req = {
      connectApi: connect,
      params: {
        userId: "userId",
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
      },
      query: {
        code: "error",
      },
    } as unknown as Request;

    const res = {
      send: jest.fn(),
      status: jest.fn(),
    } as unknown as any;

    await oauthRedirectHandler(req, res);
    const htmlResponse = res.send.mock.calls[0][0].toString();

    expect(htmlResponse.includes("Something went wrong")).toBe(true);
    expect(htmlResponse.includes("OAuth Error")).toBe(true);
  });

  it("responds error from oauthRedirectHandler if agreggator does not exist", async () => {
    const connect = new ConnectApi({
      context: {
        aggregator: "junk",
      },
    });

    await connect.init();

    const req = {
      connectApi: connect,
      params: {
        userId: "userId",
        aggregator: "junk",
      },
      query: {
        state: "request_id",
      },
    } as unknown as Request;

    await set(`context_request_id`, {
      scheme: "scheme",
      oauth_referral_source: "oauth_referral_source",
      sessionId: "session_id",
      userId: "userId",
    });

    const res = {
      send: jest.fn(),
      status: jest.fn(),
    } as unknown as any;

    await oauthRedirectHandler(req, res);
    expect(res.send).toHaveBeenCalledWith("Error");
  });
});

describe("webhookHandler", () => {
  beforeEach(async () => {
    connect = new ConnectApi({
      context,
    });

    await connect.init();
  });

  it("responds success from webhookHandler", async () => {
    const req = {
      connectApi: connect,
      params: {
        userId: "userId",
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
      },
      query: {},
    } as unknown as Request;

    const res = {
      send: jest.fn(),
      status: jest.fn(),
    } as unknown as any;

    await webhookHandler(req, res);

    expect(res.send).toHaveBeenCalledWith({
      status: ConnectionStatus.CONNECTED,
      id: undefined,
      userId: undefined,
    });
  });

  it("responds error from webhookHandler if agreggator does not exist", async () => {
    const connect = new ConnectApi({
      context: {
        aggregator: "junk",
      },
    });

    await connect.init();

    const req = {
      connectApi: connect,
      params: {
        userId: "userId",
        aggregator: "junk",
      },
      query: {},
    } as unknown as Request;

    const res = {
      send: jest.fn(),
      status: jest.fn(),
    } as unknown as any;

    await webhookHandler(req, res);

    expect(res.send).toHaveBeenCalledWith("Error");
  });
});
