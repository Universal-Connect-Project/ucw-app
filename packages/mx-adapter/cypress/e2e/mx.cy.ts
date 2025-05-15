import {
  enterMxCredentials,
  generateDataTests,
  makeAnMXConnection,
  refreshAConnection,
  searchAndSelectMx,
} from "@repo/utils-cypress";

describe("mx aggregator", () => {
  generateDataTests({
    makeAConnection: makeAnMXConnection,
    shouldTestVcEndpoint: true,
  });

  it("refreshes an mx connection if given the correct parameters and hides the back button", () => {
    refreshAConnection({
      enterCredentials: enterMxCredentials,
      selectInstitution: searchAndSelectMx,
    });
  });
});
