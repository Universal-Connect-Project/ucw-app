import { JobTypes } from "@repo/utils";
import { MappedJobTypes } from "../shared/contract";

export function decodeAuthToken(input: string) {
  try {
    const str = Buffer.from(input, "base64").toString("utf-8");
    const arr = str.split(";");
    if (arr.length !== 3) {
      return input;
    }
    return {
      aggregator: arr[0],
      token: arr[1],
      iv: arr[2],
    };
  } catch (err) {
    return input;
  }
}

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
