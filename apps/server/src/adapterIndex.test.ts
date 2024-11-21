import { getDataFromVCJwt, VCDataTypes } from "@repo/utils";
import { getAggregatorAdapter, getData, getVC } from "./adapterIndex";
import type { Aggregator } from "./adapterSetup";
import { sophtronVcAccountsData } from "./test/testData/sophtronVcData";
import { TEST_EXAMPLE_A_AGGREGATOR_STRING, TestAdapter } from "./test-adapter";
import { testVcAccountsData } from "./test/testData/testVcData";

const connectionId = "testConectionId";
const type = VCDataTypes.ACCOUNTS;
const userId = "testUserId";

describe("adapterSetup", () => {
  describe("getVC", () => {
    it("uses sophtron if the aggregator is sophtron", async () => {
      const response = await getVC({
        aggregator: "sophtron",
        connectionId,
        type,
        userId,
      });

      expect(response).toEqual(sophtronVcAccountsData);
    });

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

  describe("getAggregatorAdapter", () => {
    it("throws an error if its an unsupported aggregator", async () => {
      expect(() => getAggregatorAdapter("junk" as Aggregator)).toThrow(
        "Unsupported aggregator junk",
      );
    });

    it("returns the testExample widget adapter", () => {
      const adapter = getAggregatorAdapter(TEST_EXAMPLE_A_AGGREGATOR_STRING);

      expect(adapter).toBeInstanceOf(TestAdapter);
    });
  });
});
