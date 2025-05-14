import { searchAndSelectMx, visitAgg } from "@repo/utils-cypress";

describe("institution syncing", () => {
  it("shows an MX institution even after the github setup nuked the institution mapping before starting the server", () => {
    visitAgg();

    searchAndSelectMx();
  });
});
