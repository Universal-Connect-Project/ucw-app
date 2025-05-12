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

  it("ensures that all test institutions have is_test_bank as true", () => {
    expect(testInstitutions.length).toBeGreaterThan(0);

    testInstitutions.forEach((institution) => {
      expect(institution.is_test_bank).toBe(true);
    });
  });
});
