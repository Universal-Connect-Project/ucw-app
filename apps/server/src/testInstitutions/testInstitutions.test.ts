import type { CachedInstitution } from "@repo/utils";
import { addTestInstitutions, testInstitutions } from "./testInstitutions";

describe("testInstitutions", () => {
  describe("addTestInstitutions", () => {
    it("adds test institutions to an institution list", () => {
      const initial = [{}];

      expect(addTestInstitutions(initial as CachedInstitution[])).toEqual([
        ...initial,
        ...testInstitutions,
      ]);
    });
  });
});
