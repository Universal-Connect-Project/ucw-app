import { VCDataTypes } from "@repo/utils";

import type { AdapterDependencies } from "./models";
import { createMxIntGetVC, createMxProdGetVC } from "./createVc";

import {
  MX_VC_GET_TRANSACTIONS_PATH,
  mxTestData,
} from "@repo/utils-dev-dependency";
import { createClient, createLogClient } from "@repo/utils/test";
import { server } from "./test/testServer";
import { http, HttpResponse } from "msw";

const {
  aggregatorCredentials,
  mxVcAccountsData,
  mxVcIdentityData,
  mxVcIntegrationAccountsData,
  mxVcTranscationsData,
} = mxTestData;

const dependencies: AdapterDependencies = {
  logClient: createLogClient(),
  cacheClient: createClient(),
  aggregatorCredentials,
  envConfig: {
    HOSTURL: undefined,
  },
};

describe("getVc", () => {
  const connectionId = "connectionId";
  const userId = "userId";
  const accountId = "accountId";

  it("gets accounts VC from INT environment", async () => {
    const vc = await createMxIntGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    });
    expect(vc).toEqual(mxVcIntegrationAccountsData);
  });

  it("gets identity VC from Prod environment", async () => {
    const vc = await createMxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.IDENTITY,
      userId,
    });
    expect(vc).toEqual(mxVcIdentityData);
  });

  it("gets accounts VC from Prod environment", async () => {
    const vc = await createMxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId,
    });
    expect(vc).toEqual(mxVcAccountsData);
  });

  it("gets transactions VC from Prod environment", async () => {
    const vc = await createMxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
    });
    expect(vc).toEqual(mxVcTranscationsData);
  });
});

describe("createMxProdGetVC - getPreparedDateRangeParams", () => {
  const connectionId = "connectionId";
  const userId = "userId";
  const accountId = "accountId";
  let requestStartTime: string | undefined;
  let requestEndTime: string | undefined;

  beforeEach(() => {
    requestStartTime = undefined;
    requestEndTime = undefined;
    server.use(
      http.get(MX_VC_GET_TRANSACTIONS_PATH, ({ request }) => {
        const url = new URL(request.url);
        requestStartTime = url.searchParams.get("startTime") ?? undefined;
        requestEndTime = url.searchParams.get("endTime") ?? undefined;
        return HttpResponse.json({
          verifiableCredential: mxVcTranscationsData,
        });
      }),
    );
  });

  it("uses provided valid ISO date strings (YYYY-MM-DD)", async () => {
    const startDate = "2022-01-01";
    const endDate = "2022-02-01";
    const vc = await createMxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
      startDate,
      endDate,
    });
    expect(vc).toEqual(mxVcTranscationsData);
    expect(requestStartTime).toEqual(startDate);
    expect(requestEndTime).toEqual(endDate);
  });

  it("sets startTime to undefined if startDate is not provided", async () => {
    const endDate = "2022-02-01";
    const vc = await createMxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
      endDate,
    });
    expect(vc).toEqual(mxVcTranscationsData);
    expect(requestStartTime).toBeUndefined();
    expect(requestEndTime).toEqual(endDate);
  });

  it("sets endTime to undefined if endDate is not provided", async () => {
    const startDate = "2022-01-01";
    const vc = await createMxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
      startDate,
    });
    expect(vc).toEqual(mxVcTranscationsData);
    expect(requestStartTime).toEqual(startDate);
    expect(requestEndTime).toBeUndefined();
  });

  it("returns undefined for both if both startDate and endDate are missing", async () => {
    const vc = await createMxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId,
    });
    expect(vc).toEqual(mxVcTranscationsData);
    expect(requestStartTime).toBeUndefined();
    expect(requestEndTime).toBeUndefined();
  });

  it("throws if startDate is invalid", async () => {
    await expect(
      createMxProdGetVC(dependencies)({
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
      createMxProdGetVC(dependencies)({
        connectionId,
        type: VCDataTypes.TRANSACTIONS,
        userId,
        accountId,
        endDate: "not-a-date",
      }),
    ).rejects.toThrow("endDate must be a valid ISO 8601 date string");
  });
});
