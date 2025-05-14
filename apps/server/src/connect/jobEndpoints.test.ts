import { WidgetJobTypes } from "@repo/utils";
import { ConnectApi } from "./connectApi";
import { type JobsRequest, jobsRouteHandler } from "./jobEndpoints";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";

const context = {
  aggregator: MX_AGGREGATOR_STRING,
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
    it("responds with default response", async () => {
      const connect = new ConnectApi({
        context: {
          aggregator: "junk",
        },
      });
      await connect.init();

      const req = {
        connectApi: connect,
        params: {
          member_guid: "memberGuid",
        },
      } as unknown as JobsRequest;

      const res = {
        send: jest.fn(),
        status: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as unknown as any;

      await jobsRouteHandler(req, res);

      expect(res.send).toHaveBeenCalledWith({
        guid: req.params.member_guid,
        job_type: WidgetJobTypes.COMBINATION,
      });
    });
  });
});
