import { WidgetAdapter } from "../contract";

export const testStandardizedDatesOnTransactionEndpoints = (
  adapter: WidgetAdapter,
) => {
  const transactions = adapter.DataRequestValidators?.transactions;

  if (!transactions) {
    throw new Error(
      "transactions validator is not defined on adapter.DataRequestValidators",
    );
  }

  describe("StandardizedTransactionDateRangeValidator", () => {
    it("returns undefined for valid ISO 8601 startDate and endDate", () => {
      const req = {
        query: {
          startDate: "2021-01-01",
          endDate: "2022-01-01",
        },
      };
      expect(transactions(req)).toBeUndefined();
    });

    it("returns undefined for only valid startDate", () => {
      const req = {
        query: {
          startDate: "2021-01-01",
        },
      };
      expect(transactions(req)).toBeUndefined();
    });

    it("returns undefined for only valid endDate", () => {
      const req = {
        query: {
          endDate: "2022-01-01",
        },
      };
      expect(transactions(req)).toBeUndefined();
    });

    it("returns error message if startDate is not ISO 8601", () => {
      const req = {
        query: {
          startDate: "2021/01/01",
          endDate: "2022-01-01",
        },
      };
      expect(transactions(req)).toMatch(/startDate/);
    });

    it("returns error message if endDate is not ISO 8601", () => {
      const req = {
        query: {
          startDate: "2021-01-01",
          endDate: "2022/01/01",
        },
      };
      expect(transactions(req)).toMatch(/endDate/);
    });

    it("returns error message if both are not ISO 8601", () => {
      const req = {
        query: {
          startDate: "2021/01/01",
          endDate: "2022/01/01",
        },
      };
      expect(transactions(req)).toMatch(/startDate/);
    });

    it("returns undefined if neither startDate nor endDate are provided", () => {
      const req = { query: {} };
      expect(transactions(req)).toBeUndefined();
    });

    it("returns error if startDate is empty string", () => {
      const req = {
        query: {
          startDate: "",
          endDate: "2022-01-01",
        },
      };
      expect(transactions(req)).toMatch(/startDate/);
    });

    it("returns error if endDate is empty string", () => {
      const req = {
        query: {
          startDate: "2022-01-01",
          endDate: "",
        },
      };
      expect(transactions(req)).toMatch(/endDate/);
    });
  });
};
