import { ComboJobTypes, INSTRUMENTATION_URL } from "@repo/utils";
import configuredAxios from "./axios";

interface InstrumentationParameters {
  userId: string;
  current_member_guid?: string;
  current_aggregator?: string;
  jobTypes: ComboJobTypes[];
  sessionId?: string;
  single_account_select?: boolean;
}

export const instrumentation = async (
  parameters: InstrumentationParameters,
) => {
  const { userId, ...rest } = parameters;

  return configuredAxios.post(`${INSTRUMENTATION_URL}/userId/${userId}`, rest);
};
