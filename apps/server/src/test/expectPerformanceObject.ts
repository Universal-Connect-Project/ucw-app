import { waitFor } from "@repo/utils-dev-dependency";
import type { PerformanceObject } from "../aggregatorPerformanceMeasuring/utils";
import { getPerformanceObject } from "../aggregatorPerformanceMeasuring/utils";
import { MX_AGGREGATOR_STRING } from "@repo/mx-adapter";

export default async function expectPerformanceObject(
  sessionId: string,
  expectedAttributes?: Partial<Record<string, unknown>>,
) {
  let performanceObject: PerformanceObject | null = null;
  await waitFor(async () => {
    performanceObject = await getPerformanceObject(sessionId);
    if (expectedAttributes === null) {
      expect(performanceObject).toBeUndefined();
    } else {
      expect(performanceObject).not.toBeNull();
      expect(performanceObject).toEqual(
        expect.objectContaining({
          performanceSessionId: sessionId,
          connectionId: expect.any(String),
          userId: expect.any(String),
          aggregatorId: MX_AGGREGATOR_STRING,
          lastUiUpdateTimestamp: expect.any(Number),
          paused: false,
          ...expectedAttributes,
        }),
      );
    }
  });
  return performanceObject;
}
