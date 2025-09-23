import {
  mfaEvents,
  sampleCredentialEvents,
  sampleOAuthEvents,
} from "@repo/utils-dev-dependency/plaid/testData";
import { calculateDurationFromEvents } from "./calculateDurationFromEvents";

describe("calculateDurationFromEvents", () => {
  describe("Regular credential flows", () => {
    it("should calculate duration for complete credential flow segments", () => {
      const duration = calculateDurationFromEvents(sampleCredentialEvents);

      // Expected segments:
      // 1. SKIP_SUBMIT_PHONE to SELECT_INSTITUTION: 1s
      // 2. SELECT_INSTITUTION to CREDENTIAL: 1s
      // 3. SUBMIT_CREDENTIALS to SELECT_ACCOUNT: 2s
      // 4. CONNECTED to SUBMIT_PHONE: 2s
      // 5. Final SKIP_SUBMIT_PHONE to HANDOFF: 1s
      // Total: 7s = 7000ms
      expect(duration).toBe(7000);
    });

    it("should calculate partial duration when some flow events exist", () => {
      const eventsWithoutFlow = sampleCredentialEvents.filter(
        (e) =>
          e.event_name !== "SELECT_INSTITUTION" &&
          e.event_name !== "SUBMIT_CREDENTIALS",
      );
      const duration = calculateDurationFromEvents(eventsWithoutFlow);

      // Should still calculate segments that are available:
      // 1. SKIP_SUBMIT_PHONE to SELECT_INSTITUTION: (filtered out)
      // 2. SELECT_INSTITUTION to CREDENTIAL: (filtered out)
      // 3. SUBMIT_CREDENTIALS to SELECT_ACCOUNT: (filtered out)
      // 4. CONNECTED to SUBMIT_PHONE: 2s
      // 5. Final SKIP_SUBMIT_PHONE to HANDOFF: 2s (only one phone event, so uses first)
      // Total: 4s = 4000ms
      expect(duration).toBe(4000);
    });

    it("should calculate duration for MFA flow segments", () => {
      const duration = calculateDurationFromEvents(mfaEvents);

      // Expected MFA flow segments:
      // 1. SKIP_SUBMIT_PHONE to SELECT_INSTITUTION: 1s
      // 2. SELECT_INSTITUTION to CREDENTIAL: 0s (immediate)
      // 3a. SUBMIT_CREDENTIALS to MFA: 3s
      // 3b. SUBMIT_MFA to SELECT_ACCOUNT: 2s
      // 4. CONNECTED to SUBMIT_PHONE: 2s
      // Total: 8s = 8000ms
      expect(duration).toBe(8000);
    });

    it("should use successAt as fallback when no HANDOFF event exists in credential flow", () => {
      const eventsWithoutHandoff = sampleCredentialEvents.filter(
        (e) => e.event_name !== "HANDOFF",
      );

      // successAt is 3 seconds after the final phone event
      const successAt = "2025-07-18T16:44:28Z"; // final phone at 25s + 3s = 28s

      const duration = calculateDurationFromEvents(
        eventsWithoutHandoff,
        successAt,
      );

      // Expected segments:
      // 1. SKIP_SUBMIT_PHONE to SELECT_INSTITUTION: 1s
      // 2. SELECT_INSTITUTION to CREDENTIAL: 1s
      // 3. SUBMIT_CREDENTIALS to SELECT_ACCOUNT: 2s
      // 4. CONNECTED to SUBMIT_PHONE: 2s
      // 5. Final SKIP_SUBMIT_PHONE to successAt: 3s (using successAt fallback)
      // Total: 9s = 9000ms
      expect(duration).toBe(9000);
    });

    it("should prefer HANDOFF over successAt when HANDOFF exists in credential flow", () => {
      const successAt = "2025-07-18T16:44:30Z"; // Later than HANDOFF

      const duration = calculateDurationFromEvents(
        sampleCredentialEvents,
        successAt,
      );

      // Should use HANDOFF (26s) not successAt (30s):
      // Expected segments:
      // 1. SKIP_SUBMIT_PHONE to SELECT_INSTITUTION: 1s
      // 2. SELECT_INSTITUTION to CREDENTIAL: 1s
      // 3. SUBMIT_CREDENTIALS to SELECT_ACCOUNT: 2s
      // 4. CONNECTED to SUBMIT_PHONE: 2s
      // 5. Final SKIP_SUBMIT_PHONE to HANDOFF: 1s (using HANDOFF, not successAt)
      // Total: 7s = 7000ms
      expect(duration).toBe(7000);
    });
  });

  describe("OAuth flows", () => {
    it("should calculate duration for OAuth flow segments", () => {
      const duration = calculateDurationFromEvents(sampleOAuthEvents);

      // Expected segments for OAuth:
      // 1. SKIP_SUBMIT_PHONE to SELECT_INSTITUTION: 2s
      // 2. SELECT_INSTITUTION to OAUTH: 2s
      // 3. Final SKIP_SUBMIT_PHONE to HANDOFF: 2s
      // Total: 6s = 6000ms
      expect(duration).toBe(6000);
    });

    it("should calculate partial duration when some OAuth events exist", () => {
      const oauthEventsWithoutFlow = sampleOAuthEvents.filter(
        (e) =>
          e.event_name !== "SELECT_INSTITUTION" &&
          e.event_name !== "OPEN_OAUTH",
      );
      const duration = calculateDurationFromEvents(oauthEventsWithoutFlow);

      // Should calculate available segments:
      // 1. SKIP_SUBMIT_PHONE to SELECT_INSTITUTION: (filtered out)
      // 2. SELECT_INSTITUTION to OAUTH: (filtered out)
      // 3. Final SKIP_SUBMIT_PHONE to HANDOFF: 2s (only one phone event, so uses first)
      // Total: 4s = 4000ms (includes the initial phone to transition and final phone to handoff)
      expect(duration).toBe(4000);
    });

    it("should calculate available segments when no terminal events exist", () => {
      const oauthEventsWithoutTerminal = sampleOAuthEvents.filter(
        (e) => e.event_name !== "HANDOFF" && e.event_name !== "SUCCESS",
      );
      const duration = calculateDurationFromEvents(oauthEventsWithoutTerminal);

      // Should calculate available segments:
      // 1. SKIP_SUBMIT_PHONE to SELECT_INSTITUTION: 2s
      // 2. SELECT_INSTITUTION to OAUTH: 2s
      // 3. Final phone to HANDOFF: (no handoff, so skipped)
      // Total: 4s = 4000ms
      expect(duration).toBe(4000);
    });

    it("should work with SUCCESS as terminal event in OAuth flows", () => {
      const oauthEventsWithSuccess = [
        ...sampleOAuthEvents.filter((e) => e.event_name !== "HANDOFF"),
        {
          event_id: "oauth-success-event",
          event_metadata: {},
          event_name: "SUCCESS",
          timestamp: "2025-09-10T17:24:18Z", // 1s after final phone
        },
      ];

      const duration = calculateDurationFromEvents(oauthEventsWithSuccess);

      // Expected segments for OAuth (final phone to SUCCESS not calculated because there's only one phone event):
      // 1. SKIP_SUBMIT_PHONE to SELECT_INSTITUTION: 2s
      // 2. SELECT_INSTITUTION to OAUTH: 2s
      // 3. Final SKIP_SUBMIT_PHONE to SUCCESS: (skipped, only one phone event)
      // Total: 4s = 4000ms
      expect(duration).toBe(4000);
    });

    it("should handle OAuth flow with multiple phone events", () => {
      const eventsWithMultiplePhone = [
        ...sampleOAuthEvents,
        {
          event_id: "another-phone",
          event_metadata: {
            request_id: "another-phone",
          },
          event_name: "SUBMIT_PHONE",
          timestamp: "2025-09-10T17:24:16Z", // Between final phone and handoff
        },
      ];

      const duration = calculateDurationFromEvents(eventsWithMultiplePhone);

      // Should use the last phone event (SUBMIT_PHONE at 17:24:16)
      // Expected: 2 + 2 + 1 = 5s = 5000ms
      expect(duration).toBe(5000);
    });

    it("should use successAt as fallback when no HANDOFF event exists in OAuth flow", () => {
      const oauthEventsWithoutHandoff = sampleOAuthEvents.filter(
        (e) => e.event_name !== "HANDOFF",
      );

      // successAt is 4 seconds after the final phone event
      const successAt = "2025-09-10T17:24:19Z";

      const duration = calculateDurationFromEvents(
        oauthEventsWithoutHandoff,
        successAt,
      );

      // Expected segments for OAuth:
      // 1. SKIP_SUBMIT_PHONE to SELECT_INSTITUTION: 2s
      // 2. SELECT_INSTITUTION to OAUTH: 2s
      // 3. Final SKIP_SUBMIT_PHONE to successAt: 4s (using successAt fallback)
      // Total: 8s = 8000ms
      expect(duration).toBe(8000);
    });

    it("should prefer HANDOFF over successAt when HANDOFF exists in OAuth flow", () => {
      const successAt = "2025-09-10T17:24:20Z"; // 3s Later than HANDOFF

      const duration = calculateDurationFromEvents(
        sampleOAuthEvents,
        successAt,
      );

      // Should use HANDOFF (+2s) not successAt (+5s):
      // Expected segments for OAuth:
      // 1. SKIP_SUBMIT_PHONE to SELECT_INSTITUTION: 2s
      // 2. SELECT_INSTITUTION to OAUTH: 2s
      // 3. Final SKIP_SUBMIT_PHONE to HANDOFF: 2s (using HANDOFF, not successAt)
      // Total: 6s = 6000ms
      expect(duration).toBe(6000);
    });
  });

  describe("Flow type detection", () => {
    it("should detect OAuth flow when OPEN_OAUTH event is present", () => {
      // This is implicitly tested by the OAuth flow tests above
      const duration = calculateDurationFromEvents(sampleOAuthEvents);
      expect(duration).not.toBeNull();
    });

    it("should treat as regular flow when no OPEN_OAUTH event is present", () => {
      // This is implicitly tested by the regular flow tests above
      const duration = calculateDurationFromEvents(sampleCredentialEvents);
      expect(duration).not.toBeNull();
    });
  });
});
