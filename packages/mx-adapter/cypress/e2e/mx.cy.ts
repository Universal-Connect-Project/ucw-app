import {
  enterMxCredentials,
  generateDataTests,
  makeAConnection,
  refreshAConnection,
  searchAndSelectMx,
} from "@repo/utils-dev-dependency";

describe("mx aggregator", () => {
  generateDataTests({ makeAConnection, shouldTestVcEndpoint: true });

  it("refreshes an mx connection if given the correct parameters and hides the back button", () => {
    refreshAConnection({
      enterCredentials: enterMxCredentials,
      selectInstitution: searchAndSelectMx,
    });
  });
});
