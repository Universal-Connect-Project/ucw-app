import { WidgetJobTypes } from "@repo/utils";
import { ConnectApi } from "./connectApi";
import { JobsRequest, jobsRouteHandler } from "./jobEndpoints";
import {
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  testAggregatorMemberGuid,
  testExampleJobResponse,
} from "../test-adapter";

const context = {
  aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
};
let connect: ConnectApi;

describe("jobEndpoints", () => {
  beforeEach(async () => {
    connect = new ConnectApi({
      context,
    });
    await connect.init();
  });

  describe("jobsRouteHandler", () => {
    it("responds with aggregator's jobRequestHandler, if it exists", async () => {
      const req = {
        connectApi: connect,
        params: {
          member_guid: testAggregatorMemberGuid,
        },
      } as unknown as JobsRequest;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as any;

      await jobsRouteHandler(req, res);

      expect(res.send).toHaveBeenCalledWith(testExampleJobResponse);
    });

    it("responds with default response, if a custom jobRequestHandler doesn't exists", async () => {
      const connect = new ConnectApi({
        context: {
          aggregator: "junk",
        },
      });
      await connect.init();

      const req = {
        connectApi: connect,
        params: {
          member_guid: testAggregatorMemberGuid,
        },
      } as unknown as JobsRequest;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
      } as unknown as any;

      await jobsRouteHandler(req, res);

      expect(res.send).toHaveBeenCalledWith({
        job: {
          guid: req.params.member_guid,
          job_type: WidgetJobTypes.AGGREGATION,
        },
      });
    });
  });
});
