import { CacheClient, LogClient, PerformanceClient } from '@repo/utils';

export type ApiCredentials = {
  instance: string;
  customerId: string;
  apiKey?: string;
  apiVersion?: string | 'v3';
};

export interface AggregatorCredentials {
  flinksSandbox: ApiCredentials;
  flinks: ApiCredentials;
}

export type AdapterDependencies = {
  cacheClient: CacheClient;
  logClient: LogClient;
  aggregatorCredentials: AggregatorCredentials;
  envConfig: Record<string, string>;
};

export type AdapterConfig = {
  sandbox: boolean;
  sessionId?: string;
  dependencies: AdapterDependencies;
};

export type DataAdapterDependencies = {
  logClient: LogClient;
  aggregatorCredentials: AggregatorCredentials;
  envConfig: Record<string, string>;
  cacheClient: CacheClient;
};

export interface Account {
  EftEligibleRatio: number
  ETransferEligibleRatio: number;
  Title: string;
  TransitNumber: string;
  InstitutionNumber: string;
  OverdraftLimit: number;
  AccountNumber: string;
  LastFourDigits: string;
  Balance: AccountBalance;
  Category: string;
  Currency: string;
  Holder: AccountHolder,
  Type: string;
  AccountType: string;
  Id: string;
  Transactions: Array<Transaction>;
}

export interface AccountHolder {
  Name: string;
  Address: AccountAddress;
  Email: string;
  PhoneNumber: string;
}

export interface AccountAddress {
  CivicAddress: string;
  City: string;
  Province: string;
  PostalCode: string;
  POBox: string;
  Country: string;
}

export interface AccountBalance {
  Available: number;
  Current: number;
  Limit: number;
}

export interface AccountStatement {
  UniqueId: string;
  FileType: string;
  Base64Bytes: string;
}

export interface Login {
  Username: string;
  IsScheduledRefresh: boolean;
  LastRefresh: string;
  Type: string;
  Id: string;
}

export interface GetAccountsSummaryResponse {
  HttpStatusCode: number,
  Accounts: Array<Account>,
  Links: Array<any>;
  InstitutionName: string;
  InstitutionId: number;
  Institution: string;
  RequestId: string;
}

export interface GetAccountStatementsResponse {
  HttpStatusCode: 200;
  StatementsByAccount: Array<{
    AccountNumber: string;
    statements: Array<AccountStatement>
  }>,
  InstitutionName: string;
  Login: Login;
  InstitutionId: number;
  Institution: string;
  RequestId: string;
}

export interface GetAccountDetailsResponse {
  Accounts: Array<Account>;
  HttpStatusCode: 200;
  InstitutionName: string;
  Login: Login;
  InstitutionId: number;
  Institution: string;
  RequestId: string;
}

export interface Transaction {
  Date: string;
  Code: string;
  Description:  string;
  Debit: number;
  Credit: number;
  Balance: number;
  Id: string;
}