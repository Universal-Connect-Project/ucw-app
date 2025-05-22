import { createLogClient } from "@repo/utils/test";
import {
  getDefaultTransactionRequestEndDate,
  getDefaultTransactionRequestStartDate,
  VCDataTypes,
} from "@repo/utils";

import type { AdapterDependencies } from "./models";
import {
  SOPHTRON_VC_GET_TRANSACTIONS_PATH,
  sophtronTestData,
} from "@repo/utils-dev-dependency";
import { createSophtronVC } from "./createVc";
import { server } from "./test/testServer";
import { http, HttpResponse } from "msw";

const {
  aggregatorCredentials,
  sophtronVcTranscationsData,
  sophtronVcAccountsData,
  sophtronVcIdentityData,
} = sophtronTestData;

const dependencies: AdapterDependencies = {
  logClient: createLogClient(),
  aggregatorCredentials,
  envConfig: {
    HOSTURL: undefined,
  },
};

describe("getVc", () => {
  const connectionId = "connectionId";
  const userId = "userId";
  const accountId = "accountId";

  it("gets accounts VC", async () => {
    const vc = await createSophtronVC(dependencies)({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    });
    expect(vc).toEqual(sophtronVcAccountsData);
  });

  it("gets identity VC", async () => {
    const vc = await createSophtronVC(dependencies)({
      connectionId,
      type: VCDataTypes.IDENTITY,
      userId,
    });
    expect(vc).toEqual(sophtronVcIdentityData);
  });

  it("gets transactions VC", async () => {
    const vc = await createSophtronVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
    });
    expect(vc).toEqual(sophtronVcTranscationsData);
  });
});

describe("createSophtronVC - getPreparedDateRangeParams", () => {
  const connectionId = "connectionId";
  const userId = "userId";
  const accountId = "accountId";
  let requestStartTime: string;
  let requestEndTime: string;

  beforeEach(() => {
    requestStartTime = undefined;
    requestEndTime = undefined;
    server.use(
      http.get(SOPHTRON_VC_GET_TRANSACTIONS_PATH, ({ request }) => {
        const url = new URL(request.url);
        requestStartTime = url.searchParams.get("startTime");
        requestEndTime = url.searchParams.get("endTime");
        return HttpResponse.json({ vc: sophtronVcTranscationsData });
      }),
    );
  });

  it("uses provided valid ISO date strings (YYYY-MM-DD)", async () => {
    const startDate = "2022-01-01";
    const endDate = "2022-02-01";
    const vc = await createSophtronVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
      startDate,
      endDate,
    });
    expect(vc).toEqual(sophtronVcTranscationsData);
    expect(requestStartTime).toEqual(startDate);
    expect(requestEndTime).toEqual(endDate);
  });

  it("uses provided valid date strings (YYYY/M/D)", async () => {
    const startDate = "2022/1/1";
    const endDate = "2022/2/1";
    const vc = await createSophtronVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
      startDate,
      endDate,
    });
    expect(vc).toEqual(sophtronVcTranscationsData);
    expect(requestStartTime).toEqual("2022-01-01");
    expect(requestEndTime).toEqual("2022-02-01");
  });

  it("defaults startTime to 120 days ago if startDate is not provided", async () => {
    const endDate = "2022-02-01";
    const expectedStart = getDefaultTransactionRequestStartDate()
      .toISOString()
      .slice(0, 10);

    const vc = await createSophtronVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
      endDate,
    });
    expect(vc).toEqual(sophtronVcTranscationsData);
    expect(requestStartTime).toEqual(expectedStart);
    expect(requestEndTime).toEqual(endDate);
  });

  it("defaults endTime to 5 days in the future if endDate is not provided", async () => {
    const startDate = "2022-01-01";
    const expectedEnd = getDefaultTransactionRequestEndDate()
      .toISOString()
      .slice(0, 10);

    const vc = await createSophtronVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
      startDate,
    });
    expect(vc).toEqual(sophtronVcTranscationsData);
    expect(requestStartTime).toEqual(startDate);
    expect(requestEndTime).toEqual(expectedEnd);
  });

  it("throws if startDate is invalid", async () => {
    await expect(
      createSophtronVC(dependencies)({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        startDate: "not-a-date",
      }),
    ).rejects.toThrow("startDate must be a valid ISO 8601 date string");
  });

  it("throws if endDate is invalid", async () => {
    await expect(
      createSophtronVC(dependencies)({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        endDate: "not-a-date",
      }),
    ).rejects.toThrow("endDate must be a valid ISO 8601 date string");
  });
});
