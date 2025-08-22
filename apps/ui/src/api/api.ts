import {
  ComboJobTypes,
  INSTRUMENTATION_URL,
  OAUTH_START_URL,
} from "@repo/utils";
import configuredAxios from "./axios";

interface InstrumentationParameters {
  userId: string;
  current_member_guid?: string;
  current_aggregator?: string;
  jobTypes: ComboJobTypes[];
  singleAccountSelect?: boolean;
}

export const instrumentation = async (
  parameters: InstrumentationParameters,
) => {
  const { userId, ...rest } = parameters;

  return configuredAxios.post(`${INSTRUMENTATION_URL}/userId/${userId}`, rest);
};

export const startOauthPerformance = async ({
  institutionId,
}: {
  institutionId: string;
}) => {
  return configuredAxios.post(`${OAUTH_START_URL}`, {
    institutionId,
  });
};
