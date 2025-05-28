import {
  getDefaultTransactionRequestStartDate,
  getDefaultTransactionRequestEndDate,
  getPreparedDateRangeParams,
} from "./api";

describe("getDefaultTransactionRequestStartDate", () => {
  it("returns a date 120 days ago from today", () => {
    const now = new Date();
    const expected = new Date();
    expected.setDate(now.getDate() - 120);

    const result = getDefaultTransactionRequestStartDate();

    expect(result.toISOString().slice(0, 10)).toBe(
      expected.toISOString().slice(0, 10),
    );
  });
});

describe("getDefaultTransactionRequestEndDate", () => {
  it("returns a date 5 days in the future from today", () => {
    const now = new Date();
    const expected = new Date();
    expected.setDate(now.getDate() + 5);

    const result = getDefaultTransactionRequestEndDate();

    expect(result.toISOString().slice(0, 10)).toBe(
      expected.toISOString().slice(0, 10),
    );
  });
});

describe("getPreparedDateRangeParams", () => {
  it("returns parsed dates for valid ISO startDate and endDate", () => {
    const { preparedStartDate, preparedEndDate } = getPreparedDateRangeParams({
      startDate: "2022-01-01",
      endDate: "2022-02-01",
    });
    expect(preparedStartDate.toISOString().slice(0, 10)).toBe("2022-01-01");
    expect(preparedEndDate.toISOString().slice(0, 10)).toBe("2022-02-01");
  });

  it("defaults startDate to 120 days ago if not provided", () => {
    const endDate = "2022-02-01";
    const expectedStart = new Date();
    expectedStart.setDate(expectedStart.getDate() - 120);

    const { preparedStartDate, preparedEndDate } = getPreparedDateRangeParams({
      endDate,
    });

    expect(preparedStartDate.toISOString().slice(0, 10)).toBe(
      expectedStart.toISOString().slice(0, 10),
    );
    expect(preparedEndDate.toISOString().slice(0, 10)).toBe(endDate);
  });

  it("defaults endDate to 5 days in the future if not provided", () => {
    const startDate = "2022-01-01";
    const expectedEnd = new Date();
    expectedEnd.setDate(expectedEnd.getDate() + 5);

    const { preparedStartDate, preparedEndDate } = getPreparedDateRangeParams({
      startDate,
    });

    expect(preparedStartDate.toISOString().slice(0, 10)).toBe(startDate);
    expect(preparedEndDate.toISOString().slice(0, 10)).toBe(
      expectedEnd.toISOString().slice(0, 10),
    );
  });

  it("defaults both startDate and endDate if neither are provided", () => {
    const expectedStart = new Date();
    expectedStart.setDate(expectedStart.getDate() - 120);
    const expectedEnd = new Date();
    expectedEnd.setDate(expectedEnd.getDate() + 5);

    const { preparedStartDate, preparedEndDate } = getPreparedDateRangeParams(
      {},
    );

    expect(preparedStartDate.toISOString().slice(0, 10)).toBe(
      expectedStart.toISOString().slice(0, 10),
    );
    expect(preparedEndDate.toISOString().slice(0, 10)).toBe(
      expectedEnd.toISOString().slice(0, 10),
    );
  });

  it("throws if startDate is invalid", () => {
    expect(() =>
      getPreparedDateRangeParams({ startDate: "not-a-date" }),
    ).toThrow("startDate must be a valid ISO 8601 date string");
  });

  it("throws if endDate is invalid", () => {
    expect(() => getPreparedDateRangeParams({ endDate: "not-a-date" })).toThrow(
      "endDate must be a valid ISO 8601 date string",
    );
  });

  it("accepts a custom validDatePattern", () => {
    const { preparedStartDate } = getPreparedDateRangeParams({
      startDate: "2022/01/01",
      validDatePattern: /^\d{4}\/\d{2}\/\d{2}$/,
    });
    expect(preparedStartDate.toISOString().slice(0, 10)).toBe("2022-01-01");
  });

  it("throws if startDate does not match custom validDatePattern", () => {
    expect(() =>
      getPreparedDateRangeParams({
        startDate: "2022-01-01",
        validDatePattern: /^\d{4}\/\d{2}\/\d{2}$/,
      }),
    ).toThrow("startDate must be a valid ISO 8601 date string");
  });

  it("uses defaultEndOverride if endDate is not provided", () => {
    const override = new Date("2030-01-01");
    const { preparedEndDate } = getPreparedDateRangeParams({
      defaultEndOverride: override,
    });
    expect(preparedEndDate.toISOString().slice(0, 10)).toBe("2030-01-01");
  });
});
