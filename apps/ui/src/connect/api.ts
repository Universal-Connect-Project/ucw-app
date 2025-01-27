import configuredAxios from "./axios";

interface InstrumentationParameters {}

export const instrumentation = async (
  parameters: InstrumentationParameters,
) => {
  return configuredAxios.post("/instrumentation", {
    instrumentation: { ...parameters, widget_type: "connect_widget" },
    message: "widget-config",
  });
};
