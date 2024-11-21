import { VCDataTypes } from "@repo/utils";
import { dataAdapter } from "./dataAdapter";

describe("dataAdapter", () => {
  it("returns decoded data from the vc endpoint", () => {
    expect(
      dataAdapter({ type: VCDataTypes.ACCOUNTS }).accounts.length,
    ).toBeGreaterThan(0);
  });
});
