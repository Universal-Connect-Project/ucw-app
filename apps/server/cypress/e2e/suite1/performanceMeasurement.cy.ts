import {
  clickContinue,
  enterMxCredentials,
  expectConnectionSuccess,
  searchAndSelectMx,
  visitAgg,
} from "@repo/utils-e2e/cypress";
import { WIDGET_DEMO_ACCESS_TOKEN_ENV } from "../../shared/constants/accessToken";
import { ComboJobTypes } from "@repo/utils";
import {
  MX_AGGREGATOR_STRING,
  MX_BANK_UCP_INSTITUTION_ID,
} from "@repo/mx-adapter";

const fetchConnectionByPerformanceSessionId = (
  performanceSessionId: string,
) => {
  const accessToken = Cypress.env(WIDGET_DEMO_ACCESS_TOKEN_ENV);

  return cy
    .request({
      url: `https://api-staging.performance.universalconnectproject.org/metrics/connection/${performanceSessionId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
    .then((response) => response.body);
};

const createExpectPerformanceEvent =
  (performanceSessionId: string) => (expectedPerformanceObject) =>
    fetchConnectionByPerformanceSessionId(performanceSessionId).then(
      (performanceEvent) => {
        expect(performanceEvent).to.include({
          connectionId: performanceSessionId,
          jobTypes: ComboJobTypes.TRANSACTIONS,
          institutionId: MX_BANK_UCP_INSTITUTION_ID,
          aggregatorId: MX_AGGREGATOR_STRING,
          ...expectedPerformanceObject,
        });

        return performanceEvent;
      },
    );

describe("performance measurement", () => {
  it("records an credentials connection correctly using shouldRecordResult", () => {
    cy.intercept("GET", `/institutions/${MX_BANK_UCP_INSTITUTION_ID}`).as(
      "getInstitution",
    );

    visitAgg();

    searchAndSelectMx();

    cy.wait("@getInstitution").then((interception) => {
      const { performanceSessionId } = JSON.parse(
        interception.response?.headers?.meta as string,
      );

      const expectPerformanceEvent =
        createExpectPerformanceEvent(performanceSessionId);

      expectPerformanceEvent({
        isProcessed: false,
        shouldRecordResult: false,
      }).then(() => {
        enterMxCredentials();

        clickContinue();

        expectPerformanceEvent({
          isProcessed: false,
          shouldRecordResult: true,
        }).then(() => {
          expectConnectionSuccess();

          expectPerformanceEvent({
            shouldRecordResult: true,
          }).then((performanceEvent) => {
            expect(performanceEvent.successMetric.isSuccess).to.be.true;
          });
        });
      });
    });
  });
});
