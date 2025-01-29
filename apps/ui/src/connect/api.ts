import configuredAxios from "./axios";

interface InstrumentationParameters {}

export const INSTRUMENTATION_URL = "/instrumentation";

export const instrumentation = async (
  parameters: InstrumentationParameters,
) => {
  return configuredAxios.post(INSTRUMENTATION_URL, {
    instrumentation: { ...parameters, widget_type: "connect_widget" },
    message: "widget-config",
  });
};
