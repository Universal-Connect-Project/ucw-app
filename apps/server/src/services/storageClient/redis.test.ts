import preferences from "../../../cachedDefaults/preferences.json";
import {
  del as mockDel,
  sAdd as mockSAdd,
  set as mockSet,
} from "../../__mocks__/redis";
import config from "../../config";
import { getPreferences } from "../../shared/preferences";
import { del, get, getSet, overwriteSet, set, setNoExpiration } from "./redis";

describe("redis", () => {
  it("loads the preferences into the cache after successful connection", async () => {
    expect(await getPreferences()).toEqual(preferences);
  });

  describe("get", () => {
    it("gets a JSON.parsed value from the cache", async () => {
      const values = [
        false,
        "testString",
        { test: true },
        1234,
        null,
        undefined,
      ];
      const key = "key";

      for (const value of values) {
        await set(key, value);

        expect(await get(key)).toEqual(value);
      }
    });
  });

  describe("set", () => {
    it("calls set on the client with EX by default", async () => {
      await set("test", "test");

      expect(mockSet).toHaveBeenCalledWith("test", JSON.stringify("test"), {
        EX: config.REDIS_CACHE_TIME_SECONDS,
      });
    });

    it("calls set on the client with overriden parameters", async () => {
      await set("test", "test", {});

      expect(mockSet).toHaveBeenCalledWith("test", JSON.stringify("test"), {});
    });
  });

  describe("del", () => {
    it("calls del with the key", async () => {
      await del("test");

      expect(mockDel).toHaveBeenCalledWith("test");
    });
  });

  describe("overwriteSet", () => {
    it("calls del on the client and then sAdd", async () => {
      await overwriteSet("test", ["value1", "value2"]);

      expect(mockDel).toHaveBeenCalledWith("test");
      expect(mockSAdd).toHaveBeenCalledWith("test", ["value1", "value2"]);
    });
  });

  describe("getSet", () => {
    it("calls del on the client and then sAdd", async () => {
      const values = ["value1", "value2"];
      await overwriteSet("test", values);
      expect(await getSet("test")).toEqual(values);
    });
  });

  describe("setNoExpiration", () => {
    it("calls set on the client with no extra parameters", async () => {
      await setNoExpiration("test", "test");

      expect(mockSet).toHaveBeenCalledWith("test", JSON.stringify("test"), {});
    });
  });
});
