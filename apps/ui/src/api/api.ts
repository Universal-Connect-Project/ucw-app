import { INSTRUMENTATION_URL } from "@repo/utils";
import configuredAxios from "./axios";

interface InstrumentationParameters {
  token: string;
}

export const instrumentation = async (
  parameters: InstrumentationParameters,
) => {
  const { token } = parameters;

  return configuredAxios.post(`${INSTRUMENTATION_URL}/${token}`);
};
