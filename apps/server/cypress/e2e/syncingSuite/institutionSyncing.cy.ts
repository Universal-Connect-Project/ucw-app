import { visitAgg } from "@repo/utils-dev-dependency";
import { searchAndSelectTestExampleA } from "../../shared/utils/testExample";

describe("institution syncing", () => {
  it("shows a testExampleA institution even after the github setup nuked the institution mapping before starting the tests", () => {
    visitAgg();

    searchAndSelectTestExampleA();
  });
});
