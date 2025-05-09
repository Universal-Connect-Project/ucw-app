import { getDataFromVCJwt, VCDataTypes } from "@repo/utils";
import {
  createAggregatorWidgetAdapter,
  getAggregatorIdFromTestAggregatorId,
  getData,
  getVC,
} from "./adapterIndex";
import type { Aggregator } from "./adapterSetup";
import {
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  TEST_EXAMPLE_C_AGGREGATOR_STRING,
  TestAdapter,
} from "./test-adapter";
import { testVcAccountsData } from "./test/testData/testVcData";

const connectionId = "testConectionId";
const type = VCDataTypes.ACCOUNTS;
const userId = "testUserId";

describe("adapterSetup", () => {
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
    it("uses testExample if the aggregator is testExampleA", async () => {
      const response = await getData({
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
        connectionId,
        type,
        userId,
      });

      expect(response).toEqual(getDataFromVCJwt(testVcAccountsData));
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

    it("returns the testExample widget adapter", () => {
      const adapter = createAggregatorWidgetAdapter({
        aggregator: TEST_EXAMPLE_A_AGGREGATOR_STRING,
      });

      expect(adapter).toBeInstanceOf(TestAdapter);
    });
  });

  describe("getAggregatorIdFromTestAggregatorId", () => {
    it("gets the associated aggregatorId from a test adapter's id", () => {
      expect(
        getAggregatorIdFromTestAggregatorId(TEST_EXAMPLE_C_AGGREGATOR_STRING),
      ).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);
    });

    it("returns the testId if there is no aggregatorId associated with the one provided", () => {
      expect(
        getAggregatorIdFromTestAggregatorId(TEST_EXAMPLE_A_AGGREGATOR_STRING),
      ).toEqual(TEST_EXAMPLE_A_AGGREGATOR_STRING);
    });
  });
});
