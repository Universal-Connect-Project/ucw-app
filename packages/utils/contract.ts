// Do not remove seemingly unused exports here unless you
// check all forked Adapter repositories
// Example: JobTypes is used in the MX Adapter fork

export enum ComboJobTypes {
  ACCOUNT_NUMBER = "account_verification",
  ACCOUNT_OWNER = "identity_verification",
  TRANSACTIONS = "transactions",
  TRANSACTION_HISTORY = "transaction_history",
}

export enum WidgetJobTypes {
  AGGREGATION = 0,
  VERIFICATION = 1,
  IDENTIFICATION = 2,
  HISTORY = 3,
  STATEMENT = 4,
  ORDER = 5,
  REWARD = 6,
  BALANCE = 7,
  MICRO_DEPOSIT = 8,
  TAX = 9,
  CREDIT_REPORT = 10,
  COMBINATION = 11,
}

export enum VCDataTypes {
  ACCOUNTS = "accounts",
  IDENTITY = "identity",
  TRANSACTIONS = "transactions",
}

export enum JobTypes {
  AGGREGATE = "aggregate",
  ALL = "all",
  FULLHISTORY = "fullhistory",
  VERIFICATION = "verification",
  IDENTITY = "identity",
}

export enum MappedJobTypes {
  AGGREGATE = "aggregate",
  ALL = "aggregate_identity_verification",
  FULLHISTORY = "aggregate_extendedhistory",
  VERIFICATION = "verification",
  IDENTITY = "aggregate_identity",
}

export type AdapterMap = {
  dataAdapter?: Function;
  vcAdapter?: Function;
  createWidgetAdapter: ({
    sessionId,
  }: {
    sessionId?: string | undefined;
  }) => WidgetAdapter;
};

export interface Credential {
  id: string;
  label?: string;
  value?: string;
  field_type?: string;
  field_name?: string;
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

export interface KeyValuePair {
  key: string;
  value?: string | null;
}

export enum ChallengeType {
  QUESTION,
  OPTIONS,
  IMAGE,
  IMAGE_OPTIONS,
  TOKEN,
}

export interface Challenge {
  id: string;
  external_id?: string;
  question?: string | null;
  data?: string | KeyValuePair[];
  type?: ChallengeType;
  response?: string | number[];
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

export interface CreateConnectionRequest {
  id?: string;
  initial_job_type?: string;
  jobTypes?: ComboJobTypes[];
  background_aggregation_is_disabled?: boolean;
  credentials: Credential[];
  institution_id: string;
  is_oauth?: boolean;
  skip_aggregation?: boolean;
  metadata?: string;
}

export interface Connection {
  id: string | null;
  cur_job_id?: string | null;
  last_refresh_utc?: string | null;
  last_refreshed_utc?: string | null;
  last_updated_utc?: string | null;
  background_aggregation_is_disabled?: boolean;
  status?: ConnectionStatus | null;
  institution_code?: string | null;
  is_being_aggregated?: boolean | null;
  is_oauth?: boolean | null;
  name?: string | null;
  aggregator?: string | null;
  user_id?: string | null;
  challenges?: Challenge[];
  has_accounts?: boolean | null;
  has_transactions?: boolean | null;
  is_authenticated?: boolean | null;
  vc?: string | null;
  oauth_window_uri?: string | null;
  error_message?: string | null;
}

export interface Connections {
  members?: Connection[];
  pagination?: Pagination;
}

export interface Pagination {
  current_page?: number;
  per_page?: number;
  total_entries?: number;
  total_pages?: number;
}

export interface Institutions {
  institutions: Institution[];
  pagination?: Pagination;
}

export interface UpdateConnectionRequest {
  id: string | undefined;
  job_type?: string;
  credentials?: Credential[];
  challenges?: Challenge[];
}

export interface VCAdapterInput {
  accountId?: string;
  connectionId?: string;
  endTime?: string;
  aggregator: string;
  startTime?: string;
  type: VCDataTypes;
  userId: string;
}

export interface WidgetAdapter {
  ResolveUserId: (id: string, failIfNotFound?: boolean) => Promise<string>;
  GetInstitutionById: (id: string) => Promise<Institution>;
  ListInstitutionCredentials: (institutionId: string) => Promise<Credential[]>;
  ListConnectionCredentials: (
    connectionId: string,
    userId: string,
  ) => Promise<Credential[]>;
  ListConnections: (userId: string) => Promise<Connection[]>;
  CreateConnection: (
    connection: CreateConnectionRequest,
    userId?: string,
  ) => Promise<Connection | undefined>;
  DeleteConnection: (connectionId: string, userId?: string) => Promise<void>;
  DeleteUser: (userId: string) => Promise<any>;
  AnswerChallenge: (
    request: UpdateConnectionRequest,
    jobId: string,
    userId?: string,
  ) => Promise<boolean>;
  UpdateConnection: (
    UpdateConnectionRequest: UpdateConnectionRequest,
    userId?: string,
  ) => Promise<Connection>;
  GetConnectionById: (
    connectionId: string,
    userId?: string,
  ) => Promise<Connection | undefined>;
  GetConnectionStatus: (
    connectionId: string,
    jobId: string,
    single_account_select?: boolean,
    userId?: string,
  ) => Promise<Connection | undefined>;
  DataRequestValidators?: Record<string, (req: any) => string | undefined>;
  HandleOauthResponse?: (request: any) => Promise<Connection>;
}
