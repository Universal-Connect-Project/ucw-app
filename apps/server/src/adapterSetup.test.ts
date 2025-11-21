import { userlessAggregatorIds } from "./adapterSetup";

describe("userless aggregators", () => {
  it("should return userless aggregator IDs", () => {
    const userlessIds = userlessAggregatorIds;
    expect(userlessIds).toContain("plaid");
    expect(userlessIds).toContain("plaid_sandbox");
    expect(userlessIds).not.toContain("mx");
    expect(userlessIds).not.toContain("sophtron");
    expect(userlessIds).not.toContain("finicity");
  });
});
