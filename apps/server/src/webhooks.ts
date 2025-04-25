import ngrok from "@ngrok/ngrok";
import { info } from "./infra/logger";
import { getConfig } from "./config";

const getShouldUseNgrok = () => getConfig().NGROK_AUTHTOKEN;

let ngrokListenerUrl: string;

export const clearNgrokListenerUrl = () => {
  ngrokListenerUrl = undefined;
};

export const getWebhookHostUrl = () =>
  ngrokListenerUrl || getConfig().WEBHOOK_HOST_URL;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const startNgrok = async (app: any) => {
  if (getShouldUseNgrok()) {
    // ngrok.listen must be awaited
    await ngrok.listen(app);

    ngrokListenerUrl = app.listener.url();

    info("Established webhook listener at: " + ngrokListenerUrl);
  }
};

export const stopNgrok = () => {
  if (getShouldUseNgrok()) {
    void ngrok.kill();
  }
};
