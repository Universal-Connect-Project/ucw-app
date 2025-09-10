import { expect } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";

export const fetchConnectionByPerformanceSessionId = async ({
  accessToken,
  performanceSessionId,
  request,
}: {
  accessToken: string;
  performanceSessionId: string;
  request: any;
}) => {
  const response = await request.get(
    `https://api-staging.performance.universalconnectproject.org/metrics/connection/${performanceSessionId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return await response.json();
};

interface PerformanceEvent {
  connectionId?: string;
  jobTypes?: ComboJobTypes;
  institutionId?: string;
  aggregatorId?: string;
  [key: string]: any;
}

export const createExpectPerformanceEvent =
  ({
    accessToken,
    performanceSessionId,
    request,
  }: {
    accessToken: string;
    performanceSessionId: string;
    request: any;
  }) =>
  async (expectedPerformanceObject: PerformanceEvent) => {
    const performanceEvent = await fetchConnectionByPerformanceSessionId({
      accessToken,
      performanceSessionId,
      request,
    });

    expect(performanceEvent).toEqual(
      expect.objectContaining({
        connectionId: performanceSessionId,
        ...expectedPerformanceObject,
      }),
    );

    return performanceEvent;
  };
