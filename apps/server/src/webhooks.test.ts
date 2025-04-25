import * as config from "./config";
import {
  clearNgrokListenerUrl,
  getWebhookHostUrl,
  startNgrok,
  stopNgrok,
} from "./webhooks";

const testNgrokListenerUrl = "testNgrokListenerUrl";

jest.mock("@ngrok/ngrok", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listen: jest.fn((app: any): any => {
    app.listener = {
      url: () => testNgrokListenerUrl,
    };
  }),
  kill: jest.fn(),
}));

import ngrok from "@ngrok/ngrok";

const configWebhookHostUrl = "configWebhookHostUrl";

describe("webhooks", () => {
  afterEach(() => {
    clearNgrokListenerUrl();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ngrok.listen as any).mockClear();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ngrok.kill as any).mockClear();
  });

  describe("getWebhookHostUrl", () => {
    it("returns the ngrokListenerURl if there is one", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        NGROK_AUTHTOKEN: "testAuthToken",
        WEBHOOK_HOST_URL: configWebhookHostUrl,
      });

      await startNgrok({});

      expect(getWebhookHostUrl()).toEqual(testNgrokListenerUrl);
    });

    it("returns the url from the config", () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        WEBHOOK_HOST_URL: configWebhookHostUrl,
      });

      expect(getWebhookHostUrl()).toEqual(configWebhookHostUrl);
    });
  });

  describe("startNgrok", () => {
    it("doesnt start the listener if there's no NGROK_AUTHTOKEN", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({});

      await startNgrok({});

      expect(ngrok.listen).not.toHaveBeenCalled();

      expect(getWebhookHostUrl()).toEqual(undefined);
    });

    it("starts the listener and sets the listenerUrl if there's an NGROK_AUTHTOKEN", async () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        NGROK_AUTHTOKEN: "testAuthToken",
      });

      await startNgrok({});

      expect(ngrok.listen).toHaveBeenCalledTimes(1);

      expect(getWebhookHostUrl()).toEqual(testNgrokListenerUrl);
    });
  });

  describe("stopNgrok", () => {
    it("doesnt stop the listener if there's no NGROK_AUTHTOKEN", () => {
      jest.spyOn(config, "getConfig").mockReturnValue({});

      stopNgrok();

      expect(ngrok.kill).not.toHaveBeenCalled();
    });

    it("stops the listener if there's an NGROK_AUTHTOKEN", () => {
      jest.spyOn(config, "getConfig").mockReturnValue({
        NGROK_AUTHTOKEN: "testAuthToken",
      });

      stopNgrok();

      expect(ngrok.kill).toHaveBeenCalledTimes(1);
    });
  });
});
