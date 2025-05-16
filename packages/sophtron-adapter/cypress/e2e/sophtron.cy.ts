import { ComboJobTypes } from "@repo/utils";
import {
  generateDataTests,
  visitAgg,
  expectConnectionSuccess,
  clickContinue,
  searchByText,
  refreshAConnection,
  visitWithPostMessageSpy,
  MEMBER_STATUS_UPDATE_EVENT_TYPE,
} from "@repo/utils-cypress";
import {
  enterSophtronCredentials,
  searchAndSelectSophtron,
  selectSophtronAccount,
} from "../shared/utils/sophtron";

const makeAConnection = async (jobTypes) => {
  searchAndSelectSophtron();
  enterSophtronCredentials();
  clickContinue();

  if (jobTypes.includes(ComboJobTypes.ACCOUNT_NUMBER)) {
    selectSophtronAccount();
    clickContinue();
  }
  expectConnectionSuccess();
};

describe("Sophtron aggregator", () => {
  generateDataTests({
    makeAConnection,
    transactionsAccountSelector: (accounts) =>
      accounts.find(
        (account) => account?.depositAccount?.nickname === "Primary Checking",
      ),
    shouldTestVcEndpoint: true,
    transactionsQueryString: "?start_time=2021/1/1&end_time=2099/12/31",
  });

  it("shows single account select if no parameter is passed, and skips single account select if singleAccountSelect=false", () => {
    const userId = Cypress.env("userId");

    cy.visit(
      `/widget?jobTypes=${ComboJobTypes.ACCOUNT_NUMBER}&userId=${userId}`,
    );

    searchAndSelectSophtron();

    enterSophtronCredentials();

    clickContinue();

    selectSophtronAccount();
    clickContinue();

    expectConnectionSuccess();

    cy.visit(
      `/widget?jobTypes=${ComboJobTypes.ACCOUNT_NUMBER}&userId=${userId}&singleAccountSelect=false`,
    );

    searchAndSelectSophtron();

    enterSophtronCredentials();

    clickContinue();

    expectConnectionSuccess();
  });

  it("refreshes a sophtron connection if given the correct parameters and hides the back button", () => {
    refreshAConnection({
      enterCredentials: enterSophtronCredentials,
      selectInstitution: searchAndSelectSophtron,
    });
  });

  it("fires a memberStatusUpdated event with custom properties", () => {
    const jobTypes = [ComboJobTypes.TRANSACTIONS, ComboJobTypes.ACCOUNT_NUMBER];

    const userId = Cypress.env("userId");

    visitWithPostMessageSpy(`/widget?jobTypes=${jobTypes}&userId=${userId}`)
      .then(() => makeAConnection(jobTypes))
      .then(() => {
        // Capture postmessages into variables
        cy.get("@postMessage", { timeout: 90000 }).then((mySpy) => {
          const memberStatusUpdateEvents = (mySpy as any)
            .getCalls()
            .filter(
              (call) => call.args[0].type === MEMBER_STATUS_UPDATE_EVENT_TYPE,
            );

          expect(memberStatusUpdateEvents.length).to.be.greaterThan(1);

          const { metadata } = memberStatusUpdateEvents.at(-1).args[0];

          [
            "rawStatus",
            "selectedAccountId",
            "aggregator",
            "member_guid",
            "user_guid",
            "connection_status",
          ].forEach((prop) => {
            expect(!!metadata[prop]).to.be.true;
          });
        });
      });
  });

  it("Connects to Sophtron Bank with all MFA options", () => {
    visitAgg({});
    searchByText("Sophtron Bank");
    cy.findByLabelText("Add account with Sophtron Bank").first().click();
    cy.findByLabelText("User ID").type("asdfg12X");
    cy.findByLabelText("Password").type("asdfg12X");
    clickContinue();

    cy.findByRole("textbox", {
      name: "Please enter the Captcha code",
      timeout: 45000,
    }).type("asdf");
    clickContinue();

    cy.findByLabelText("What is your favorite color?", { timeout: 45000 }).type(
      "asdf",
    );
    clickContinue();

    cy.findByText("xxx-xxx-1234", { timeout: 45000 }).click();
    clickContinue();

    cy.findByRole("textbox", {
      name: "Please enter the Token",
      timeout: 45000,
    }).type("asdf");
    clickContinue();

    expectConnectionSuccess();
  });
});
