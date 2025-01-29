import configuredAxios from "./axios";

interface InstrumentationParameters {
  user_id: string;
  current_member_guid?: string;
  current_aggregator?: string;
  job_type: string;
  single_account_select?: boolean;
}

export const INSTRUMENTATION_URL = "/instrumentation";

export const instrumentation = async (
  parameters: InstrumentationParameters,
) => {
  return configuredAxios.post(INSTRUMENTATION_URL, parameters);
};
