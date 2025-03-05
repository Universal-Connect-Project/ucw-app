import { ConnectionStatus } from "@repo/utils";

export const updateMFAResponse = {
  institution_guid: "institutionCode",
  guid: "testConnectionId",
  connection_status: ConnectionStatus.CREATED,
  most_recent_job_guid: null,
  is_oauth: false,
  aggregator: "testExampleC",
  is_being_aggregated: false,
  mfa: {},
};
