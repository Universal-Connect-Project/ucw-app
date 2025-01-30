import { JobTypes } from "@repo/utils";
import { MappedJobTypes } from "../shared/contract";

export function mapJobType(input: JobTypes) {
  const inputLowerCase = input.toLowerCase();
  switch (inputLowerCase) {
    case JobTypes.AGGREGATE:
      return MappedJobTypes.AGGREGATE;
    case JobTypes.ALL:
      return MappedJobTypes.ALL;
    case JobTypes.FULLHISTORY:
      return MappedJobTypes.FULLHISTORY;
    case JobTypes.VERIFICATION:
      return MappedJobTypes.VERIFICATION;
    case JobTypes.IDENTITY:
      return MappedJobTypes.IDENTITY;
    default:
      throw new Error("Invalid job type");
  }
}
