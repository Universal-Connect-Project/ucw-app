import { describe, expect, it } from "vitest";
import postMessageEventOverrides from "./postMessageEventOverrides";

const ucpInstitutionId = "testUcpInstitutionId";

const testEvent = {
  test: "value",
};

describe("postMessageEventOverrides", () => {
  describe("memberConnected", () => {
    describe("createEventData", () => {
      it("returns an object with the ucpInstitutionId as well as whatever is in postMessageEventData", () => {
        expect(
          postMessageEventOverrides.memberConnected.createEventData({
            institution: {
              ucpInstitutionId,
            },
            member: {
              postMessageEventData: {
                memberConnected: testEvent,
              },
            },
          }),
        ).toEqual({ ucpInstitutionId, ...testEvent });
      });
    });
  });

  describe("memberStatusUpdate", () => {
    describe("createEventData", () => {
      it("returns an object with the ucpInstitutionId as well as whatever is in postMessageEventData", () => {
        expect(
          postMessageEventOverrides.memberStatusUpdate.createEventData({
            institution: {
              ucpInstitutionId,
            },
            member: {
              postMessageEventData: {
                memberStatusUpdate: testEvent,
              },
            },
          }),
        ).toEqual({ ucpInstitutionId, ...testEvent });
      });
    });

    describe("getHasStatusChanged", () => {
      const member1 = {
        postMessageEventData: {
          memberStatusUpdate: { value: 1 },
        },
      };

      const member2 = {
        postMessageEventData: {
          memberStatusUpdate: { value: 2 },
        },
      };

      it("returns true if the object has changed", () => {
        expect(
          postMessageEventOverrides.memberStatusUpdate.getHasStatusChanged({
            currentMember: member1,
            previousMember: member2,
          }),
        ).toBe(true);
      });

      it("returns false if the object has not changed", () => {
        expect(
          postMessageEventOverrides.memberStatusUpdate.getHasStatusChanged({
            currentMember: member1,
            previousMember: member1,
          }),
        ).toBe(false);
      });
    });
  });
});
