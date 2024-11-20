import { decodeVcData, getDataFromVCJwt } from "./verifiableCredentials";

describe("verifiable credentials", () => {
  describe("decodeVcData", () => {
    it("returns a json object from the middle of the jwt", () => {
      const testObject = { test: "test" };

      expect(
        decodeVcData(`abcd.${btoa(JSON.stringify(testObject))}.efgh`),
      ).toEqual(testObject);
    });
  });

  describe("getDataFromVCJwt", () => {
    it("returns the credential subject from the decoded jwt", () => {
      const testObject = {
        vc: {
          credentialSubject: "test",
        },
      };

      expect(
        getDataFromVCJwt(`abcd.${btoa(JSON.stringify(testObject))}.efg`),
      ).toEqual("test");
    });
  });
});
