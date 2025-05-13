import { getDataFromVCJwt, VCDataTypes } from "@repo/utils";
import {
  createAggregatorWidgetAdapter,
  getAggregatorIdFromTestAggregatorId,
  getData,
  getVC,
} from "./adapterIndex";
import type { Aggregator } from "./adapterSetup";
import {
  MX_AGGREGATOR_STRING,
  MX_INT_AGGREGATOR_STRING,
  MxAdapter,
} from "@repo/mx-adapter";
import { mxVcAccountsData } from "@repo/utils-dev-dependency";

const connectionId = "testConectionId";
const type = VCDataTypes.ACCOUNTS;
const userId = "testUserId";

describe("adapterIndex", () => {
  describe("getVC", () => {
    it("throws an error if the aggregator doesnt have a handler", async () => {
      await expect(
        async () =>
          await getVC({
            aggregator: "junk" as Aggregator,
            connectionId,
            type,
            userId,
          }),
      ).rejects.toThrow("Unsupported aggregator junk");
    });
  });

  describe("getData", () => {
    it("uses mx if the aggregator is mx", async () => {
      const response = await getData({
        aggregator: MX_AGGREGATOR_STRING,
        connectionId,
        type,
        userId,
      });

      expect(response).toEqual(getDataFromVCJwt(mxVcAccountsData));
    });

    it("throws an error if the aggregator doesnt have a handler", async () => {
      await expect(
        async () =>
          await getData({
            aggregator: "junk" as Aggregator,
            connectionId,
            type,
            userId,
          }),
      ).rejects.toThrow("Unsupported aggregator junk");
    });
  });

  describe("createAggregatorWidgetAdapter", () => {
    it("throws an error if its an unsupported aggregator", async () => {
      expect(() =>
        createAggregatorWidgetAdapter({ aggregator: "junk" as Aggregator }),
      ).toThrow("Unsupported aggregator junk");
    });

    it("returns the mx widget adapter", () => {
      const adapter = createAggregatorWidgetAdapter({
        aggregator: MX_AGGREGATOR_STRING,
      });

      expect(adapter).toBeInstanceOf(MxAdapter);
    });
  });

  describe("getAggregatorIdFromTestAggregatorId", () => {
    it("gets the associated aggregatorId from a test adapter's id", () => {
      expect(
        getAggregatorIdFromTestAggregatorId(MX_INT_AGGREGATOR_STRING),
      ).toEqual(MX_AGGREGATOR_STRING);
    });

    it("returns the testId if there is no aggregatorId associated with the one provided", () => {
      expect(getAggregatorIdFromTestAggregatorId(MX_AGGREGATOR_STRING)).toEqual(
        MX_AGGREGATOR_STRING,
      );
    });
  });
});
