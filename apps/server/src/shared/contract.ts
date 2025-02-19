import type { Aggregator } from "../adapterSetup";

export type { Aggregator };

export interface AuthRequest {
  aggregator: string;
  token: string;
  iv: string;
  key: string;
}

export interface Context {
  institution_id?: string;
  institution_uid?: string;
  include_identity?: boolean;
  connection_id?: string;
  current_job_id?: string;
  user_id?: string;
  resolved_user_id?: string;
  aggregator?: string | null;
  job_type?: string;
  partner?: string;
  single_account_select?: boolean;
  auth?: AuthRequest;
  oauth_referral_source?: string;
  scheme?: string;
  updated?: boolean;
  session_id?: string;
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

export enum OAuthStatus {
  _,
  PENDING,
  COMPLETE,
  ERROR,
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

export enum MappedJobTypes {
  AGGREGATE = "aggregate",
  ALL = "aggregate_identity_verification",
  FULLHISTORY = "aggregate_extendedhistory",
  VERIFICATION = "verification",
  IDENTITY = "aggregate_identity",
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
