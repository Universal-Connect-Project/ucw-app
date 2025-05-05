import { CacheClient, LogClient } from "@repo/utils";

export type ApiCredentials = {
  secret?: string;
  partnerId?: string;
  appKey?: string;
};

export interface AggregatorCredentials {
  finicitySandbox: ApiCredentials;
  finicityProd: ApiCredentials;
}

export interface Customer {
  id: string;
}

interface AccountDetail {
  dateAsOf?: number;
  availableBalanceAmount?: number;
  openDate?: number;
  periodStartDate?: number;
  periodEndDate?: number;
  periodInterestRate?: number;
  periodDepositAmount?: number;
  periodInterestAmount?: number;
  interestYtdAmount?: number;
  interestPriorYtdAmount?: number;
  maturityDate?: number;
  interestRate?: string;
  creditAvailableAmount?: number;
  creditMaxAmount?: number;
  cashAdvanceAvailableAmount?: number;
  cashAdvanceMaxAmount?: number;
  cashAdvanceBalance?: number;
  cashAdvanceInterestRate?: number;
  currentBalance?: number;
  paymentMinAmount?: number;
  paymentDueDate?: number;
  previousBalance?: number;
  statementStartDate?: number;
  statementEndDate?: number;
  statementPurchaseAmount?: number;
  statementFinanceAmount?: number;
  statementCreditAmount?: number;
  rewardEarnedBalance?: number;
  pastDueAmount?: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: number;
  statementCloseBalance?: number;
  termOfMl?: string;
  mlHolderName?: string;
  description?: string;
  lateFeeAmount?: number;
  payoffAmount?: number;
  payoffAmountDate?: number;
  originalMaturityDate?: number;
  principalBalance?: number;
  escrowBalance?: number;
  interestPeriod?: string;
  initialMlAmount?: number;
  initialMlDate?: number;
  nextPaymentPrincipalAmount?: number;
  nextPaymentInterestAmount?: number;
  nextPayment?: number;
  nextPaymentDate?: number;
  lastPaymentDueDate?: number;
  lastPaymentReceiveDate?: number;
  lastPaymentPrincipalAmount?: number;
  lastPaymentInterestAmount?: number;
  lastPaymentEscrowAmount?: number;
  lastPaymentLastFeeAmount?: number;
  lastPaymentLateCharge?: number;
  ytdPrincipalPaid?: number;
  ytdInterestPaid?: number;
  ytdInsurancePaid?: number;
  ytdTaxPaid?: number;
  autoPayEnrolled?: boolean;
  marginAllowed?: boolean;
  cashAccountAllowed?: boolean;
  collateral?: string;
  currentSchool?: string;
  firstPaymentDate?: number;
  firstMortgage?: boolean;
  loanPaymentFreq?: string;
  originalSchool?: string;
  recurringPaymentAmount?: number;
  lender?: string;
  endingBalanceAmount?: number;
  loanTermType?: string;
  paymentsMade?: number;
  balloonAmount?: number;
  projectedInterest?: number;
  interestPaidLtd?: number;
  interestRateType?: string;
  loanPaymentType?: string;
  repaymentPlan?: string;
  paymentsRemaining?: number;
  marginBalance?: number;
  shortBalance?: number;
  availableCashBalance?: number;
  maturityValueAmount?: number;
  vestedBalance?: number;
  empMatchAmount?: number;
  empPretaxContribAmount?: number;
  empPretaxContribAmountYtd?: number;
  contribTotalYtd?: number;
  cashBalanceAmount?: number;
  preTaxAmount?: number;
  afterTaxAmount?: number;
  matchAmount?: number;
  profitSharingAmount?: number;
  rolloverAmount?: number;
  otherVestAmount?: number;
  otherNonvestAmount?: number;
  currentLoanBalance?: number;
  loanRate?: number;
  buyPower?: number;
  rolloverLtd?: number;
  loanAwardId?: string;
  originalInterestRate?: number;
  guarantor?: string;
  owner?: string;
  interestSubsidyType?: string;
  interestBalance?: number;
  remainingTermOfMl?: number;
  initialInterestRate?: number;
  feesBalance?: number;
  loanYtdInterestPaid?: number;
  loanYtdFeesPaid?: number;
  loanYtdPrincipalPaid?: number;
  loanStatus?: string;
  loanStatusStartDate?: number;
  loanStatusEndDate?: number;
  weightedInterestRate?: number;
  repaymentPlanStartDate?: number;
  repaymentPlanEndDate?: number;
  expectedPayoffDate?: number;
  outOfSchoolDate?: number;
  convertToRepayment?: number;
  daysDelinquent?: number;
  totalPrincipalPaid?: number;
  totalInterestPaid?: number;
  totalAmountPaid?: number;
}

export interface Account {
  id: string;
  number: string;
  accountNumberDisplay: string;
  name: string;
  balance: number;
  type: string;
  status: string;
  customerId: string;
  institutionId: string;
  balanceDate: number;
  aggregationAttemptDate: number;
  createdDate: number;
  linkedAccountDate: number;
  currency: string;
  institutionLoginId: number;
  displayPosition: number;
  accountNickname: string;
  marketSegment: string;
  detail?: AccountDetail;
}

export interface AccountAchDetails {
  routingNumber: string;
  realAccountNumber: string;
}

export interface AccountOwnerAddress {
  ownerAddress: string;
  type?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface AccountOwner {
  ownerName: string;
  nameClassification?: string;
  nameClassificationconfidencescore?: number;
  addresses: AccountOwnerAddress[];
  emails?: { email: string }[];
  phones?: { phone: string; type: string; country: string }[];
}

export interface Transaction {
  amount: number;
  id: string;
  postedDate: number;
  transactionDate: number;
  description: string;
  memo: string;
  type?: string;
  accountId: number;
  customerId: number;
  status: string;
  createdDate: number;
  categorization: {
    normalizedPayeeName: string;
    category: string;
    bestRepresentation: string;
    country: string;
  };
}

export type AdapterDependencies = {
  cacheClient: CacheClient;
  logClient: LogClient;
  aggregatorCredentials: AggregatorCredentials;
  envConfig: Record<string, string>;
  getWebhookHostUrl: () => string;
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
  getWebhookHostUrl: () => string;
  cacheClient: CacheClient;
};
