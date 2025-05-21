import {
  enterMxCredentials,
  generateDataTests,
  makeAnMXConnection,
  refreshAConnection,
  searchAndSelectMx,
} from "@repo/utils-cypress";

const oneMonthAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);
const todayIso = new Date().toISOString().slice(0, 10);

describe("mx aggregator", () => {
  generateDataTests({
    makeAConnection: makeAnMXConnection,
    shouldTestVcEndpoint: true,
    transactionsQueryStrings: [
      `?startDate=${oneMonthAgoIso}&endDate=${todayIso}`,
    ],
  });

  it("refreshes an mx connection if given the correct parameters and hides the back button", () => {
    refreshAConnection({
      enterCredentials: enterMxCredentials,
      selectInstitution: searchAndSelectMx,
    });
  });
});
