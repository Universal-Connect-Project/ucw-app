import { get, set } from "../services/storageClient/redis";
import type { Response, Request } from "express";
import { ConnectApi } from "./connectApi";
import { webhookHandler, oauthRedirectHandler } from "./oauthEndpoints";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING } from "../test-adapter";
import { oauthSuccessResponse } from "./testData/oauth";
import { format } from "prettier";
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

  it("responds success from oauthRedirectHandler", async () => {
    const req = {
      connectApi: connect,
      params: {
        userId: "userId",
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
      },
      query: {
        state: "request_id",
        code: "test_code",
      },
    } as unknown as Request;

    await set(`request_id`, {
      guid: "test_guid",
      id: "request_id",
    });

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
    const called = res.send.mock.calls[0][0].toString();
    const actual = await format(called, { parser: "html" });
    const expected = await format(oauthSuccessResponse, { parser: "html" });
    expect(actual).toEqual(expected);
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
      query: {
        state: "request_id",
        code: "test_code",
      },
    } as unknown as Request;

    await set(`context_request_id`, {
      scheme: "scheme",
      oauth_referral_source: "oauth_referral_source",
      sessionId: "session_id",
      userId: "userId",
    });

    await set(`request_id`, {
      guid: "test_guid",
      id: "request_id",
    });

    const res = {
      send: jest.fn(),
      status: jest.fn(),
    } as unknown as any;

    await webhookHandler(req, res);

    expect(res.send).toHaveBeenCalledWith({
      id: "request_id",
      request_id: "request_id",
      guid: "test_guid",
      userId: "test_code",
      status: ConnectionStatus.CONNECTED,
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

    await webhookHandler(req, res);

    expect(res.send).toHaveBeenCalledWith("Error");
  });
});
