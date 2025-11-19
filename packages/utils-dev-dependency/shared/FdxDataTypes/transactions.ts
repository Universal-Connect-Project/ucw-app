import { SecurityIdType } from "./common";

// FDX 5.3.0 Transaction Types for Universal Connect Widget

// ===== Base Types =====
export interface Currency {
  currencyRate?: number;
  currencyCode?: string; // ISO 4217 currency code
  originalCurrencyCode?: string; // Original ISO 4217 currency code
}

export interface FiAttribute {
  name: string; // max 32 characters
  value: string; // max 256 characters
}

export interface PaginatedArray {
  links?: Array<{
    rel: string;
    href: string;
  }>;
  resultType?: string;
  count?: number;
}

export interface PaymentDetails {
  principalAmount?: number;
  interestAmount?: number;
  escrowTotalAmount?: number;
  escrowTaxAmount?: number;
  escrowInsuranceAmount?: number;
  escrowPmiAmount?: number;
  escrowFeesAmount?: number;
  escrowOtherAmount?: number;
}

// ===== Enums =====

export enum DebitCreditMemo {
  CREDIT = "CREDIT",
  DEBIT = "DEBIT",
}

export enum TransactionStatus {
  POSTED = "POSTED",
  PENDING = "PENDING",
  CANCELLED = "CANCELLED",
}

export enum DepositTransactionType {
  CHECK = "CHECK",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER = "TRANSFER",
  POSDEBIT = "POSDEBIT",
  ATMWITHDRAWAL = "ATMWITHDRAWAL",
  BILLPAYMENT = "BILLPAYMENT",
  FEE = "FEE",
  DEPOSIT = "DEPOSIT",
  ADJUSTMENT = "ADJUSTMENT",
  INTEREST = "INTEREST",
  DIVIDEND = "DIVIDEND",
  DIRECTDEPOSIT = "DIRECTDEPOSIT",
  ATMDEPOSIT = "ATMDEPOSIT",
  POSCREDIT = "POSCREDIT",
}

export enum LoanTransactionType {
  PAYMENT = "PAYMENT",
  FEE = "FEE",
  ADJUSTMENT = "ADJUSTMENT",
  INTEREST = "INTEREST",
}

export enum LocTransactionType {
  CHECK = "CHECK",
  WITHDRAWAL = "WITHDRAWAL",
  PAYMENT = "PAYMENT",
  FEE = "FEE",
  ADJUSTMENT = "ADJUSTMENT",
  INTEREST = "INTEREST",
  PURCHASE = "PURCHASE",
}

export enum InvestmentTransactionType {
  PURCHASED = "PURCHASED",
  SOLD = "SOLD",
  PURCHASEDTOCOVER = "PURCHASEDTOCOVER",
  ADJUSTMENT = "ADJUSTMENT",
  PURCHASETOOPEN = "PURCHASETOOPEN",
  PURCHASETOCLOSE = "PURCHASETOCLOSE",
  SOLDTOOPEN = "SOLDTOOPEN",
  SOLDTOCLOSE = "SOLDTOCLOSE",
  INTEREST = "INTEREST",
  MARGININTEREST = "MARGININTEREST",
  REINVESTOFINCOME = "REINVESTOFINCOME",
  RETURNOFCAPITAL = "RETURNOFCAPITAL",
  TRANSFER = "TRANSFER",
  CONTRIBUTION = "CONTRIBUTION",
  FEE = "FEE",
  OPTIONEXERCISE = "OPTIONEXERCISE",
  OPTIONEXPIRATION = "OPTIONEXPIRATION",
  DIVIDEND = "DIVIDEND",
  DIVIDENDREINVEST = "DIVIDENDREINVEST",
  SPLIT = "SPLIT",
  CLOSURE = "CLOSURE",
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  CLOSUREOPT = "CLOSUREOPT",
  INVEXPENSE = "INVEXPENSE",
  JRNLSEC = "JRNLSEC",
  JRNLFUND = "JRNLFUND",
  OTHER = "OTHER",
  DIV = "DIV",
  SRVCHG = "SRVCHG",
  DEP = "DEP",
  DEPOSIT = "DEPOSIT",
  ATM = "ATM",
  POS = "POS",
  XFER = "XFER",
  CHECK = "CHECK",
  PAYMENT = "PAYMENT",
  CASH = "CASH",
  DIRECTDEP = "DIRECTDEP",
  DIRECTDEBIT = "DIRECTDEBIT",
  REPEATPMT = "REPEATPMT",
}

export enum InsuranceTransactionType {
  PREMIUM = "PREMIUM",
  CLAIM = "CLAIM",
  DIVIDEND = "DIVIDEND",
  FEE = "FEE",
}

export enum SecurityType {
  BOND = "BOND",
  DEBT = "DEBT",
  DIGITALASSET = "DIGITALASSET",
  MUTUALFUND = "MUTUALFUND",
  OPTION = "OPTION",
  OTHER = "OTHER",
  STOCK = "STOCK",
  SWEEP = "SWEEP",
}

export enum Inv401kSourceType {
  PRETAX = "PRETAX",
  AFTERTAX = "AFTERTAX",
  MATCH = "MATCH",
  PROFITSHARING = "PROFITSHARING",
  ROLLOVER = "ROLLOVER",
  OTHERVEST = "OTHERVEST",
  OTHERNONVEST = "OTHERNONVEST",
}

export enum IncomeType {
  CGLONG = "CGLONG", // capital gains-long term
  CGSHORT = "CGSHORT", // capital gains-short term
  MISC = "MISC",
}

export enum SubAccountType {
  CASH = "CASH",
  MARGIN = "MARGIN",
  SHORT = "SHORT",
  OTHERS = "OTHERS",
}

export enum UnitType {
  SHARES = "SHARES",
  CURRENCY = "CURRENCY",
}

export enum TransactionReason {
  CALL = "CALL", // the debt was called
  SELL = "SELL", // the debt was sold
  MATURITY = "MATURITY", // the debt reached maturity
}

export enum TransferDirection {
  IN = "IN",
  OUT = "OUT",
}

export enum PositionType {
  LONG = "LONG",
  SHORT = "SHORT",
}

export enum TreasuryManagementType {
  BAI = "BAI",
  BTRS = "BTRS",
  ISO = "ISO",
  SWIFT = "SWIFT",
}

export interface CommercialCode {
  type: TreasuryManagementType;
  code: string;
}

export interface LineItem {
  description?: string;
  amount?: number;
  checkNumber?: number;
  memo?: string; // max 255 characters
  reference?: string;
  imageIds?: string[];
  links?: Array<{
    rel: string;
    href: string;
  }>;
}

export interface TransactionReward {
  categoryId?: string; // Identifier - Long term persistent identity of the reward category
  accrued?: number; // Reward units accrued on this transaction
  adjusted?: number; // Reward units adjusted on this transaction
}

export interface TransactionBase {
  accountId: string; // Identifier
  transactionId: string; // Identifier
  referenceTransactionId?: string; // Identifier
  postedTimestamp?: string; // ISO 8601 datetime
  transactionTimestamp?: string; // ISO 8601 datetime
  description?: string;
  memo?: string; // max 255 characters
  debitCreditMemo?: DebitCreditMemo;
  category?: string;
  subCategory?: string;
  reference?: string;
  status?: TransactionStatus;
  amount: number;
  foreignAmount?: number;
  foreignCurrency?: string; // ISO 4217 code
  imageIds?: string[];
  lineItem?: LineItem[];
  reward?: TransactionReward;
  fiAttributes?: FiAttribute[];
  links?: Array<{
    rel: string;
    href: string;
  }>;
}

// ===== Specific Transaction Types =====

export interface DepositTransaction extends TransactionBase {
  transactionType?: DepositTransactionType;
  payee?: string; // max 255 characters
  checkNumber?: number;
}

export interface LoanTransaction extends TransactionBase {
  transactionType?: LoanTransactionType;
  paymentDetails?: PaymentDetails;
}

export interface LocTransaction extends TransactionBase {
  transactionType?: LocTransactionType;
  checkNumber?: number;
  paymentDetails?: PaymentDetails;
}

export interface InvestmentTransaction extends TransactionBase {
  transactionType?: InvestmentTransactionType;
  shares?: number; // Required for stock, mutual funds. Negative indicates removal
  faceValue?: number; // Cash value for bonds
  price?: number; // Unit purchase price
  securityId?: string;
  securityIdType?: SecurityIdType;
  securityType?: SecurityType;
  symbol?: string; // Ticker symbol
  markup?: number; // Dealer markup portion
  commission?: number;
  taxes?: number;
  fees?: number;
  load?: number;
  inv401kSource?: Inv401kSourceType;
  confirmationNumber?: string;
  fractionalCash?: number; // Cash for fractional units (stock splits)
  incomeType?: IncomeType;
  oldUnits?: number; // Shares before split
  splitRatioNumerator?: number;
  splitRatioDenominator?: number;
  newUnits?: number; // Shares after split
  subAccountSec?: SubAccountType; // Sub-account security type
  subAccountFund?: SubAccountType; // Source account type
  loanId?: string; // 401k loan indicator
  loanPrincipal?: number; // Loan pre-payment principal
  loanInterest?: number; // Loan pre-payment interest
  payrollDate?: string; // ISO 8601 date
  priorYearContrib?: boolean; // Prior year contribution flag
  withholding?: number; // Federal tax withholding
  taxExempt?: boolean;
  gain?: number; // For sales
  stateWithholding?: number;
  penalty?: number; // Penalty amount
  runningBalance?: number; // Position running balance
  unitPrice?: number; // Price per unit (excludes markup)
  units?: number; // Quantity for security actions
  unitType?: UnitType;
  transactionReason?: TransactionReason;
  accruedInterest?: number;
  transferAction?: TransferDirection;
  positionType?: PositionType;
  digitalUnits?: string; // Full precision units (unlimited decimal places)
  settlementTimestamp?: string; // ISO 8601 datetime
}

export interface InsuranceTransaction extends TransactionBase {
  transactionType?: InsuranceTransactionType;
}

export interface CommercialTransaction extends TransactionBase {
  immediateAvailableBalance?: number;
  nextDayAvailableBalance?: number;
  twoDaysPlusAvailableBalance?: number;
  referenceBankId?: string;
  referenceBranchId?: string;
  referenceCustomerId?: string;
  commercialCode?: CommercialCode;
  memo?: string;
}

// ===== Transaction Union Types =====

export type TransactionItem =
  | { depositTransaction: DepositTransaction }
  | { loanTransaction: LoanTransaction }
  | { locTransaction: LocTransaction }
  | { investmentTransaction: InvestmentTransaction }
  | { insuranceTransaction: InsuranceTransaction }
  | { commercialTransaction: CommercialTransaction };

// ===== Main Transactions Response =====

export interface FdxTransactionsResponse extends PaginatedArray {
  transactions: TransactionItem[];
}

// ===== Type Guards =====

export function isDepositTransaction(
  item: TransactionItem,
): item is { depositTransaction: DepositTransaction } {
  return "depositTransaction" in item;
}

export function isLoanTransaction(
  item: TransactionItem,
): item is { loanTransaction: LoanTransaction } {
  return "loanTransaction" in item;
}

export function isLocTransaction(
  item: TransactionItem,
): item is { locTransaction: LocTransaction } {
  return "locTransaction" in item;
}

export function isInvestmentTransaction(
  item: TransactionItem,
): item is { investmentTransaction: InvestmentTransaction } {
  return "investmentTransaction" in item;
}

export function isInsuranceTransaction(
  item: TransactionItem,
): item is { insuranceTransaction: InsuranceTransaction } {
  return "insuranceTransaction" in item;
}

export function isCommercialTransaction(
  item: TransactionItem,
): item is { commercialTransaction: CommercialTransaction } {
  return "commercialTransaction" in item;
}
