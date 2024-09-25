import { http, HttpResponse } from "msw";
import { clearIntervalAsync } from "set-interval-async";
import { server } from "../test/testServer";
import {
  fetchInstitutions,
  setInstitutionSyncSchedule,
  syncInstitutions,
} from "./institutionSyncer";

import config from "../config";
import * as logger from "src/infra/logger";
import { ElasticSearchMock } from "../test/elasticSearchMock";
import { elasticSearchInstitutionData } from "../test/testData/institution";
import {
  INSTITUTION_CURRENT_LIST_IDS,
  INSTITUTION_ETAG_REDIS_KEY,
} from "./storageClient/constants";
import { overwriteSet, set } from "./storageClient/redis";

jest.mock("fs");

describe("setInstitutionSyncSchedule", () => {
  it("should call sync over the given interval", async () => {
    jest.useFakeTimers();
    let pollerCounter = 0;
    server.use(
      http.get(config.INSTITUTION_CACHE_LIST_URL, () => {
        pollerCounter += 1;
        return HttpResponse.json({});
      }),
    );

    const poller = await setInstitutionSyncSchedule(0.25);

    expect(pollerCounter).toEqual(0);

    await jest.advanceTimersByTimeAsync(15000);
    expect(pollerCounter).toEqual(1);

    await jest.advanceTimersByTimeAsync(15000);
    expect(pollerCounter).toEqual(2);
    await clearIntervalAsync(poller);
    jest.useRealTimers();
  });
});

describe("syncInstitutions", () => {
  beforeEach(async () => {
    const mockETag = "etag123";
    await set(INSTITUTION_ETAG_REDIS_KEY, mockETag);
  });

  it("should skip update if response status is 304 (not modified)", async () => {
    const infoLogSpy = jest.spyOn(logger, "info");

    server.use(
      http.get(
        config.INSTITUTION_CACHE_LIST_URL,
        () =>
          new HttpResponse(null, { status: 304, statusText: "Not Modified" }),
      ),
    );

    await syncInstitutions();

    expect(infoLogSpy).toHaveBeenCalledWith(
      "Institution Cache List unchanged. Skipping Update",
    );
  });

  it("should call update methods if response is 200", async () => {
    const infoLogSpy = jest.spyOn(logger, "info");
    const oldInstitutionUcpId = "UCP-old1";

    await overwriteSet(INSTITUTION_CURRENT_LIST_IDS, [
      oldInstitutionUcpId,
      elasticSearchInstitutionData.id,
    ]);

    const deletedInsIds: string[] = [];
    ElasticSearchMock.add(
      {
        method: "DELETE",
        path: "/institutions/_doc/:id",
      },
      (params) => {
        const pathStr = params.path as string;
        const id = pathStr.split("/").pop();
        deletedInsIds.push(id);
        return {};
      },
    );
    let esUpdatesCount = 0;
    ElasticSearchMock.add(
      {
        method: ["PUT", "POST"],
        path: "/institutions/_update/:id",
      },
      () => {
        esUpdatesCount += 1;
        return {};
      },
    );

    const institutionData = [elasticSearchInstitutionData];
    server.use(
      http.get(config.INSTITUTION_CACHE_LIST_URL, () =>
        HttpResponse.json(institutionData),
      ),
    );

    await syncInstitutions();

    expect(infoLogSpy).toHaveBeenCalledWith("Updating institution cache list");
    expect(deletedInsIds).toEqual([oldInstitutionUcpId]);
    expect(esUpdatesCount).toEqual(1);
  });

  it("should log warning message when forbidden access", async () => {
    const warningLogSpy = jest.spyOn(logger, "warning");

    server.use(
      http.get(config.INSTITUTION_CACHE_LIST_URL, () =>
        HttpResponse.json(null, { status: 401, statusText: "Forbidden" }),
      ),
    );

    await syncInstitutions();

    expect(warningLogSpy).toHaveBeenCalledWith(
      "Unauthorized access to institution cache list",
    );
  });

  it("should fail gracefully when fetch fails", async () => {
    const warningLogSpy = jest.spyOn(logger, "warning");

    server.use(
      http.get(config.INSTITUTION_CACHE_LIST_URL, () => HttpResponse.error()),
    );

    await syncInstitutions();

    expect(warningLogSpy).toHaveBeenCalledWith(
      "Institution Server not responding",
    );
  });
});

describe("fetchInstitutions", () => {
  it("returns a response when the server is available", async () => {
    server.use(
      http.get(
        config.INSTITUTION_CACHE_LIST_URL,
        () =>
          new HttpResponse(null, { status: 304, statusText: "Not Modified" }),
      ),
    );

    const response = await fetchInstitutions();
    expect(response).not.toBeNull();
  });

  it("returns null when the server is unavailable", async () => {
    server.use(
      http.get(config.INSTITUTION_CACHE_LIST_URL, () => HttpResponse.error()),
    );

    const response = await fetchInstitutions();
    expect(response).toBeNull();
  });
});
