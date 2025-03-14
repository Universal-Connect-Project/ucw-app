import type { ComboJobTypes } from "@repo/utils";
import config from "../config";
import { debug } from "../infra/logger";
import { getAccessToken } from "./auth0Service";

export const recordStartEvent = async ({
  connectionId,
  jobTypes,
}: {
  connectionId: string;
  jobTypes: ComboJobTypes[];
}) => {
  try {
    const accessToken = await getAccessToken();

    return await fetch(
      `${config.PERFORMANCE_TRACKING_URL}/${connectionId}/connectionStart`,
      {
        body: JSON.stringify({
          jobTypes,
        }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        method: "POST",
      },
    );
  } catch (error) {
    debug("Record start event failed with error:", error);
  }
};
