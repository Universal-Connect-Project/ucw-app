import { ComboJobTypes, INSTRUMENTATION_URL } from "@repo/utils";
import configuredAxios from "./axios";

interface InstrumentationParameters {
  user_id: string;
  current_member_guid?: string;
  current_aggregator?: string;
  jobTypes: ComboJobTypes[];
  sessionId?: string;
  single_account_select?: boolean;
}

export const instrumentation = async (
  parameters: InstrumentationParameters,
) => {
  const { user_id, ...rest } = parameters;

  return configuredAxios.post(`${INSTRUMENTATION_URL}/userId/${user_id}`, rest);
};
