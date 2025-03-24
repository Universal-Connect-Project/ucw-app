import {
  generateDataTests,
  refreshAConnection,
} from "@repo/utils-dev-dependency";
import {
  enterMxCredentials,
  makeAConnection,
  searchAndSelectMx,
} from "../utils/mx";

describe("mx aggregator", () => {
  generateDataTests({ makeAConnection, shouldTestVcEndpoint: true });

  it("refreshes an mx connection if given the correct parameters and hides the back button", () => {
    refreshAConnection({
      enterCredentials: enterMxCredentials,
      selectInstitution: searchAndSelectMx,
    });
  });
});
