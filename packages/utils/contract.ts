export enum VCDataTypes {
  ACCOUNTS = 'accounts',
  IDENTITY = 'identity',
  TRANSACTIONS = 'transactions'
}

export type AdapterMap = {
  oauthResponseHandler?: Function
  vcAdapter: Function
  widgetAdapter: WidgetAdapter
}

export interface Credential {
  id: string
  label?: string
  value?: string
  field_type?: string
  field_name?: string
}

export interface Institution {
  id: string | null
  name: string
  url: string
  logo_url: string | null
  aggregator?: string | null
  oauth?: boolean | false
  code?: string | null
  instructional_text?: string | null
  small_logo_url?: string | null
  // eslint-disable-next-line @typescript-eslint/ban-types
  aggregators?: Object | {}
}

export interface KeyValuePair {
  key: string
  value?: string | null
}

export enum ChallengeType {
  QUESTION,
  OPTIONS,
  IMAGE,
  IMAGE_OPTIONS,
  TOKEN
}

export interface Challenge {
  id: string
  external_id?: string
  question?: string | null
  data?: string | KeyValuePair[]
  type?: ChallengeType
  response?: string | number[]
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
  PENDING
}

export interface CreateConnectionRequest {
  id?: string
  initial_job_type?: string
  background_aggregation_is_disabled?: boolean
  credentials: Credential[]
  institution_id: string
  is_oauth?: boolean
  skip_aggregation?: boolean
  metadata?: string
}

export interface Connection {
  id: string | null
  cur_job_id?: string | null
  last_refresh_utc?: string | null
  last_refreshed_utc?: string | null
  last_updated_utc?: string | null
  background_aggregation_is_disabled?: boolean
  status?: ConnectionStatus | null
  institution_code?: string | null
  is_being_aggregated?: boolean | null
  is_oauth?: boolean | null
  name?: string | null
  aggregator?: string | null
  user_id?: string | null
  challenges?: Challenge[]
  has_accounts?: boolean | null
  has_transactions?: boolean | null
  is_authenticated?: boolean | null
  vc?: string | null
  oauth_window_uri?: string | null
  error_message?: string | null
}

export interface UpdateConnectionRequest {
  id: string | undefined
  job_type?: string
  credentials?: Credential[]
  challenges?: Challenge[]
}

export interface WidgetAdapter {
  ResolveUserId: (id: string, failIfNotFound?: boolean) => Promise<string>
  GetInstitutionById: (id: string) => Promise<Institution>
  ListInstitutionCredentials: (institutionId: string) => Promise<Credential[]>
  ListConnectionCredentials: (
    connectionId: string,
    userId: string
  ) => Promise<Credential[]>
  ListConnections: (userId: string) => Promise<Connection[]>
  CreateConnection: (
    connection: CreateConnectionRequest,
    userId?: string
  ) => Promise<Connection | undefined>
  DeleteConnection: (connectionId: string, userId?: string) => Promise<void>
  DeleteUser: (userId: string) => Promise<any>
  AnswerChallenge: (
    request: UpdateConnectionRequest,
    jobId: string,
    userId?: string
  ) => Promise<boolean>
  UpdateConnection: (
    UpdateConnectionRequest: UpdateConnectionRequest,
    userId?: string
  ) => Promise<Connection>
  GetConnectionById: (
    connectionId: string,
    userId?: string
  ) => Promise<Connection | undefined>
  GetConnectionStatus: (
    connectionId: string,
    jobId: string,
    single_account_select?: boolean,
    userId?: string
  ) => Promise<Connection | undefined>
}
