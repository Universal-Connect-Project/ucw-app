import type { ComboJobTypes } from "@repo/utils";
import type { Aggregator } from "../adapterSetup";

export type { Aggregator };

export interface Context {
  institutionId?: string;
  connectionId?: string;
  current_job_id?: string;
  userId?: string;
  resolvedUserId?: string;
  aggregator?: string | null;
  jobTypes?: ComboJobTypes[];
  singleAccountSelect?: boolean;
  oauth_referral_source?: string;
  scheme?: string;
  sessionId?: string;
}

export enum ConnectionStatus {
  CREATED,
  PREVENTED,
  DENIED,
  CHALLENGED,
  REJECTED,
  LOCKED,
  CONNECTED,
  IMPEDED,
  RECONNECTED,
  DEGRADED,
  DISCONNECTED,
  DISCONTINUE,
  CLOSED,
  DELAYED,
  FAILED,
  UPDATED,
  DISABLED,
  IMPORTED,
  RESUMED,
  EXPIRED,
  IMPAIRED,
  PENDING,
}

export enum VcType {
  IDENTITY,
  ACCOUNTS,
  TRANSACTIONS,
}

export interface Institution {
  id: string | null;
  name: string;
  url: string;
  logo_url: string | null;
  aggregator?: string | null;
  oauth?: boolean | false;
  code?: string | null;
  instructional_text?: string | null;
  small_logo_url?: string | null;
  // eslint-disable-next-line @typescript-eslint/ban-types
  aggregators?: Object | {};
}

export interface ResolvedInstitution {
  id: string;
  url: string;
  name: string;
  logo_url: string;
  aggregator: Aggregator;
  oauth?: boolean;
}

// This will go away once all aggregators are migrated
export enum Aggregators {
  TEST_A = "testExampleA",
  TEST_B = "testExampleB",
  TEST_C = "testExampleC",
}

export enum JobTypeSupports {
  AGGREGATE = "supports_aggregation",
  VERIFICATION = "supports_verification",
  IDENTIFICATION = "supports_identification",
  FULLHISTORY = "supports_history",
}

export interface CachedInstitution {
  name: string;
  keywords: string[];
  logo: string;
  url: string;
  id: string;
  is_test_bank: boolean | false;
  routing_numbers: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [propName: string]: any;
}

export interface InstitutionAggregator {
  id: string | null;
  supports_aggregation: boolean | false;
  supports_oauth: boolean | false;
  supports_identification: boolean | false;
  supports_verification: boolean | false;
  supports_history: boolean | false;
}

export interface InstitutionSearchResponseItem {
  guid: string | null;
  name: string;
  url: string;
  logo_url: string | null;
  supports_oauth?: boolean | false;
}
