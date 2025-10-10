import { Iso3166CountryCode, SecurityIdType } from "./common";

interface FdxCurrency {
  currencyRate?: number;
  currencyCode?: string;
  originalCurrencyCode?: string;
}

export interface FdxFiAttribute {
  name: string;
  value: string;
}

export enum AccountCategory {
  ANNUITY_ACCOUNT = "ANNUITY_ACCOUNT",
  DEPOSIT_ACCOUNT = "DEPOSIT_ACCOUNT",
  LOAN_ACCOUNT = "LOAN_ACCOUNT",
  LOC_ACCOUNT = "LOC_ACCOUNT",
  INSURANCE_ACCOUNT = "INSURANCE_ACCOUNT",
  INVESTMENT_ACCOUNT = "INVESTMENT_ACCOUNT",
}

export enum AccountSubType {
  _401A = "401A",
  _401K = "401K",
  _403B = "403B",
  _529 = "529",
  ANNUITY = "ANNUITY",
  AUTOLOAN = "AUTOLOAN",
  BROKERAGEPRODUCT = "BROKERAGEPRODUCT",
  CD = "CD",
  CHARGE = "CHARGE",
  CHECKING = "CHECKING",
  COMMERCIALDEPOSIT = "COMMERCIALDEPOSIT",
  COMMERCIALINVESTMENT = "COMMERCIALINVESTMENT",
  COMMERCIALLINEOFCREDIT = "COMMERCIALLINEOFCREDIT",
  COMMERCIALLOAN = "COMMERCIALLOAN",
  COVERDELL = "COVERDELL",
  CREDITCARD = "CREDITCARD",
  DEFERREDPROFITSHARINGPLAN = "DEFERREDPROFITSHARINGPLAN",
  DEFINEDBENEFIT = "DEFINEDBENEFIT",
  DIGITALASSET = "DIGITALASSET",
  ESCROW = "ESCROW",
  ESOP = "ESOP",
  FIXEDANNUITY = "FIXEDANNUITY",
  GUARDIAN = "GUARDIAN",
  HOMEEQUITYLOAN = "HOMEEQUITYLOAN",
  HOMELINEOFCREDIT = "HOMELINEOFCREDIT",
  INDIVIDUALPENSIONPLAN = "INDIVIDUALPENSIONPLAN",
  INSTALLMENT = "INSTALLMENT",
  INSTITUTIONALTRUST = "INSTITUTIONALTRUST",
  INVESTMENTACCOUNT = "INVESTMENTACCOUNT",
  IRA = "IRA",
  KEOGH = "KEOGH",
  LIFEINCOMEFUND = "LIFEINCOMEFUND",
  LINEOFCREDIT = "LINEOFCREDIT",
  LOAN = "LOAN",
  LOCKEDINRETIREMENTACCOUNT = "LOCKEDINRETIREMENTACCOUNT",
  LOCKEDINRETIREMENTINCOMEFUND = "LOCKEDINRETIREMENTINCOMEFUND",
  LOCKEDINRETIREMENTSAVINGSPLAN = "LOCKEDINRETIREMENTSAVINGSPLAN",
  LONGTERMDISABILITY = "LONGTERMDISABILITY",
  MILITARYLOAN = "MILITARYLOAN",
  MONEYMARKET = "MONEYMARKET",
  MORTGAGE = "MORTGAGE",
  NONQUALIFIEDPLAN = "NONQUALIFIEDPLAN",
  OTHERDEPOSIT = "OTHERDEPOSIT",
  OTHERINVESTMENT = "OTHERINVESTMENT",
  PERSONALLOAN = "PERSONALLOAN",
  POOLEDREGISTEREDPENSIONPLAN = "POOLEDREGISTEREDPENSIONPLAN",
  PRESCRIBEDREGISTEREDRETIREMENTINCOMEFUND = "PRESCRIBEDREGISTEREDRETIREMENTINCOMEFUND",
  REGISTEREDDISABILITYSAVINGSPLAN = "REGISTEREDDISABILITYSAVINGSPLAN",
  REGISTEREDEDUCATIONSAVINGSPLAN = "REGISTEREDEDUCATIONSAVINGSPLAN",
  REGISTEREDPENSIONPLAN = "REGISTEREDPENSIONPLAN",
  REGISTEREDRETIREMENTINCOMEFUND = "REGISTEREDRETIREMENTINCOMEFUND",
  REGISTEREDRETIREMENTSAVINGSPLAN = "REGISTEREDRETIREMENTSAVINGSPLAN",
  RESTRICTEDLIFEINCOMEFUND = "RESTRICTEDLIFEINCOMEFUND",
  RESTRICTEDLOCKEDINSAVINGSPLAN = "RESTRICTEDLOCKEDINSAVINGSPLAN",
  ROLLOVER = "ROLLOVER",
  ROTH = "ROTH",
  SARSEP = "SARSEP",
  SAVINGS = "SAVINGS",
  SMBLOAN = "SMBLOAN",
  SHORTTERMDISABILITY = "SHORTTERMDISABILITY",
  SPECIFIEDPENSIONPLAN = "SPECIFIEDPENSIONPLAN",
  STUDENTLOAN = "STUDENTLOAN",
  TAXABLE = "TAXABLE",
  TAXFREESAVINGSACCOUNT = "TAXFREESAVINGSACCOUNT",
  TDA = "TDA",
  TERM = "TERM",
  TRUST = "TRUST",
  UGMA = "UGMA",
  UNIVERSALLIFE = "UNIVERSALLIFE",
  UTMA = "UTMA",
  VARIABLEANNUITY = "VARIABLEANNUITY",
  WHOLELIFE = "WHOLELIFE",
}

export interface FdxAccountBase {
  accountId: string;
  error?: {
    code?: string;
    message?: string;
    debugMessage?: string;
  };
  accountCategory?: AccountCategory;
  accountType?: AccountSubType;
  accountNumber?: string;
  accountNumberDisplay?: string;
  productName?: string;
  nickname?: string;
  status?: AccountStatus;
  description?: string;
  accountOpenDate?: string;
  accountCloseDate?: string;
  currency?: FdxCurrency;
  fiAttributes?: FdxFiAttribute[];
  parentAccountId?: string;
  lineOfBusiness?: string;
  routingTransitNumber?: string;
  balanceType?: BalanceType;
  interestRate?: number;
  interestRateType?: InterestRateType;
  interestRateAsOf?: string;
  priorInterestRate?: number;
  interestRateIndex?: string;
  earlyPenaltyFlag?: boolean;
  transferIn?: boolean;
  transferOut?: boolean;
  billPayStatus?: BillPayStatus;
  micrNumber?: string;
  lastActivityDate?: string;
  rewardProgramId?: string;
  transactionsIncluded?: boolean;
  domicile?: {
    countryCode?: Iso3166CountryCode;
    region?: string;
  };
}

export interface FdxDepositAccount extends FdxAccountBase {
  balanceAsOf?: string;
  currentBalance?: number;
  openingDayBalance?: number;
  availableBalance?: number;
  annualPercentageYield?: number;
  interestYtd?: number;
  term?: number;
  maturityDate?: string;
}

export enum FDXTimePeriod {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  SEMIMONTHLY = "SEMIMONTHLY",
  MONTHLY = "MONTHLY",
  SEMIANNUALLY = "SEMIANNUALLY",
  ANNUALLY = "ANNUALLY",
}

export interface FdxLoanAccount extends FdxAccountBase {
  balanceAsOf?: string;
  principalBalance?: number;
  escrowBalance?: number;
  originalPrincipal?: number;
  originatingDate?: string;
  loanTerm?: number;
  totalNumberOfPayments?: number;
  nextPaymentAmount?: number;
  nextPaymentDate?: string;
  paymentFrequency?: FDXTimePeriod;
  compoundingPeriod?: FDXTimePeriod;
  payOffAmount?: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
  maturityDate?: string;
  interestPaidYearToDate?: number;
  transactions?: Array<{
    transactionType?: "PAYMENT" | "FEE" | "ADJUSTMENT" | "INTEREST";
    paymentDetails?: {
      principalAmount?: number;
      interestAmount?: number;
      insuranceAmount?: number;
      escrowAmount?: number;
      pmiAmount?: number;
      feesAmount?: number;
    };
  }>;
}

export interface FdxLocAccount extends FdxAccountBase {
  balanceAsOf?: string;
  creditLine?: number;
  availableCredit?: number;
  nextPaymentAmount?: number;
  nextPaymentDate?: string;
  principalBalance?: number;
  currentBalance?: number;
  minimumPaymentAmount?: number;
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
  pastDueAmount?: number;
  lastStmtBalance?: number;
  lastStmtDate?: string;
  purchasesApr?: number;
  advancesApr?: number;
  cashAdvanceLimit?: number;
  availableCash?: number;
  financeCharges?: number;
  cardNetwork?: string;
  cardArt?: {
    label?: string;
    imageUri?: string;
  };
  transactions?: Array<{
    transactionType?:
      | "CHECK"
      | "WITHDRAWAL"
      | "PAYMENT"
      | "FEE"
      | "ADJUSTMENT"
      | "INTEREST"
      | "PURCHASE";
    checkNumber?: number;
    paymentDetails?: {
      principalAmount?: number;
      interestAmount?: number;
      insuranceAmount?: number;
      escrowAmount?: number;
      pmiAmount?: number;
      feesAmount?: number;
    };
  }>;
}

export interface FdxInvestmentAccount extends FdxAccountBase {
  balanceAsOf?: string;
  allowedCheckWriting?: boolean;
  allowedOptionTrade?: boolean;
  currentValue?: number;
  holdings?: Array<{
    holdingId?: string;
    securityId?: string;
    securityIdType?: SecurityIdType;
    holdingName?: string;
    holdingType?:
      | "ANNUITY"
      | "BOND"
      | "CD"
      | "DIGITALASSET"
      | "MUTUALFUND"
      | "OPTION"
      | "OTHER"
      | "STOCK";
    holdingSubType?: "MONEYMARKET" | "CASH";
    positionType?: "LONG" | "SHORT";
    heldInAccount?: "CASH" | "MARGIN" | "SHORT" | "OTHER";
    description?: string;
    symbol?: string;
    originalPurchaseDate?: string;
    purchasedPrice?: number;
    currentAmortizationFactor?: number;
    currentUnitPrice?: number;
    changeInPrice?: number;
    currentUnitPriceDate?: string;
    units?: number;
    marketValue?: number;
    faceValue?: number;
    averageCost?: boolean;
    cashAccount?: boolean;
    rate?: number;
    expirationDate?: string;
    inv401kSource?:
      | "PRETAX"
      | "AFTERTAX"
      | "MATCH"
      | "PROFITSHARING"
      | "ROLLOVER"
      | "OTHERVEST"
      | "OTHERNONVEST";
    currency?: FdxCurrency;
    assetClasses?: Array<{
      portion?: number;
      description?: string;
    }>;
    fiAssetClasses?: Array<{
      name: string;
      portion?: number;
    }>;
    fiAttributes?: FdxFiAttribute[];
    taxLots?: Array<{
      lotId?: string;
      originalPurchaseDate?: string;
      purchasedPrice?: number;
      units?: number;
      marketValue?: number;
    }>;
    digitalUnits?: string;
    mutualFundSecurity?: {
      mutualFundType?: "OPENEND" | "CLOSEEND" | "OTHER";
      unitsStreet?: number;
      unitsUser?: number;
      reinvestDividends?: boolean;
      reinvestCapitalGains?: boolean;
      yield?: number;
      yieldAsOfDate?: string;
    };
    optionSecurity?: {
      secured?: "NAKED" | "COVERED";
      optionType?: "PUT" | "CALL";
      strikePrice?: number;
      expireDate?: string;
      sharesPerContract?: number;
    };
    otherSecurity?: {
      typeDescription?: string;
    };
    stockSecurity?: {
      unitsStreet?: number;
      unitsUser?: number;
      reinvestDividends?: boolean;
      stockType?: "COMMON" | "PREFERRED" | "CONVERTIBLE" | "OTHER";
      yield?: number;
      yieldAsOfDate?: string;
    };
    sweepSecurity?: {
      currentBalance?: number;
      availableBalance?: number;
      balanceAsOf?: string;
      checks?: boolean;
    };
    debtSecurity?: {
      parValue?: number;
      debtType?: "COUPON" | "ZERO";
      debtClass?: "TREASURY" | "MUNICIPAL" | "CORPORATE" | "OTHER";
      couponRate?: number;
      couponDate?: string;
      couponMatureFrequency?:
        | "MONTHLY"
        | "QUARTERLY"
        | "SEMIANNUAL"
        | "ANNUAL"
        | "OTHER";
      callPrice?: number;
      yieldToCall?: number;
      callDate?: string;
      callType?: "CALL" | "PUT" | "PREFUND" | "MATURITY";
      yieldToMaturity?: number;
      bondMaturityDate?: string;
    };
  }>;
  openOrders?: Array<{
    orderId?: string;
    securityId?: string;
    securityIdType?: SecurityIdType;
    symbol?: string;
    description?: string;
    units?: number;
    orderType?:
      | "BUY"
      | "SELL"
      | "BUYTOCOVER"
      | "BUYTOOPEN"
      | "SELLTOCOVER"
      | "SELLTOOPEN"
      | "SELLSHORT"
      | "SELLCLOSE";
    orderDate?: string;
    unitPrice?: number;
    unitType?: "SHARES" | "CURRENCY";
    orderDuration?: "DAY" | "GOODTILLCANCEL" | "IMMEDIATE";
    subAccount?: "CASH" | "MARGIN" | "SHORT" | "OTHER";
    limitPrice?: number;
    stopPrice?: number;
    inv401kSource?:
      | "PRETAX"
      | "AFTERTAX"
      | "MATCH"
      | "PROFITSHARING"
      | "ROLLOVER"
      | "OTHERVEST"
      | "OTHERNONVEST";
  }>;
  contribution?: Array<{
    securityId?: string;
    securityIdType?: SecurityIdType;
    employerMatchPercentage?: number;
    employerMatchAmount?: number;
    employeePreTaxAmount?: number;
    employeePreTaxPercentage?: number;
    employeeAfterTaxAmount?: number;
    employeeAfterTaxPercentage?: number;
    employeeDeferPreTaxAmount?: number;
    employeeDeferPreTaxPercentage?: number;
    employeeYearToDate?: number;
    employerYearToDate?: number;
    rolloverContributionPercentage?: number;
    rolloverContributionAmount?: number;
  }>;
  vesting?: Array<{
    vestingDate?: string;
    symbol?: string;
    strikePrice?: number;
    vestingPercentage?: number;
    otherVestAmount?: number;
    otherVestPercentage?: number;
    vestedBalance?: number;
    unVestedBalance?: number;
    vestedQuantity?: number;
    unVestedQuantity?: number;
  }>;
  investmentLoans?: Array<{
    loanId?: string;
    loanDescription?: string;
    initialLoanBalance?: number;
    loanStartDate?: string;
    currentLoanBalance?: number;
    dateAsOf?: string;
    loanRate?: number;
    loanPaymentAmount?: number;
    loanPaymentFrequency?:
      | "WEEKLY"
      | "BIWEEKLY"
      | "TWICEMONTHLY"
      | "MONTHLY"
      | "FOURWEEKS"
      | "BIMONTHLY"
      | "QUARTERLY"
      | "SEMIANNUALLY"
      | "ANNUALLY"
      | "OTHER";
    loanPaymentInitial?: number;
    loanPaymentsRemaining?: number;
    loanMaturityDate?: string;
    loanInterestToDate?: number;
    loanTotalProjectedInterest?: number;
    loanNextPaymentDate?: string;
  }>;
  availableCashBalance?: number;
  margin?: boolean;
  marginBalance?: number;
  shortBalance?: number;
  rolloverAmount?: number;
  employerName?: string;
  brokerId?: string;
  planId?: string;
  calendarYearFor401K?: number;
  balanceList?: Array<{
    balanceName?: string;
    balanceDescription?: string;
    balanceType?: "AMOUNT" | "PERCENTAGE";
    balanceValue?: number;
    balanceDate?: string;
    currency?: FdxCurrency;
  }>;
  dailyChange?: number;
  percentageChange?: number;
  transactions?: Array<{
    transactionType?:
      | "PURCHASED"
      | "SOLD"
      | "PURCHASEDTOCOVER"
      | "ADJUSTMENT"
      | "PURCHASETOOPEN"
      | "PURCHASETOCLOSE"
      | "SOLDTOOPEN"
      | "SOLDTOCLOSE"
      | "INTEREST"
      | "MARGININTEREST"
      | "REINVESTOFINCOME"
      | "RETURNOFCAPITAL"
      | "TRANSFER"
      | "CONTRIBUTION"
      | "FEE"
      | "OPTIONEXERCISE"
      | "OPTIONEXPIRATION"
      | "DIVIDEND"
      | "DIVIDENDREINVEST"
      | "SPLIT"
      | "CLOSURE"
      | "INCOME"
      | "EXPENSE"
      | "CLOSUREOPT"
      | "INVEXPENSE"
      | "JRNLSEC"
      | "JRNLFUND"
      | "OTHER"
      | "DIV"
      | "SRVCHG"
      | "DEP"
      | "DEPOSIT"
      | "ATM"
      | "POS"
      | "XFER"
      | "CHECK"
      | "PAYMENT"
      | "CASH"
      | "DIRECTDEP"
      | "DIRECTDEBIT"
      | "REPEATPMT";
    shares?: number;
    faceValue?: number;
    price?: number;
    securityId?: string;
    securityIdType?: SecurityIdType;
    securityType?:
      | "BOND"
      | "DEBT"
      | "DIGITALASSET"
      | "MUTUALFUND"
      | "OPTION"
      | "OTHER"
      | "STOCK"
      | "SWEEP";
    symbol?: string;
    markup?: number;
    commission?: number;
    taxes?: number;
    fees?: number;
    load?: number;
    inv401kSource?:
      | "PRETAX"
      | "AFTERTAX"
      | "MATCH"
      | "PROFITSHARING"
      | "ROLLOVER"
      | "OTHERVEST"
      | "OTHERNONVEST";
    confirmationNumber?: string;
    fractionalCash?: number;
    incomeType?: "CGLONG" | "CGSHORT" | "MISC";
    oldUnits?: number;
    splitRatioNumerator?: number;
    splitRatioDenominator?: number;
    newUnits?: number;
    subAccountSec?: "CASH" | "MARGIN" | "SHORT" | "OTHERS";
    subAccountFund?: "CASH" | "MARGIN" | "SHORT" | "OTHERS";
    loanId?: string;
    loanPrincipal?: number;
    loanInterest?: number;
    payrollDate?: string;
    priorYearContrib?: boolean;
    withholding?: number;
    taxExempt?: boolean;
    gain?: number;
    stateWithholding?: number;
    penalty?: number;
    runningBalance?: number;
    unitPrice?: number;
    units?: number;
    unitType?: "SHARES" | "CURRENCY";
    transactionReason?: "CALL" | "SELL" | "MATURITY";
    accruedInterest?: number;
    transferAction?: "IN" | "OUT";
    positionType?: "LONG" | "SHORT";
    digitalUnits?: string;
    settlementTimestamp?: string;
  }>;
  pensionSource?: Array<{
    displayName?: string;
    amount?: number;
    paymentOption?: string;
    asOfDate?: string;
    frequency?: FDXTimePeriod;
    startDate?: string;
  }>;
}

export interface FdxInsuranceAccount extends FdxAccountBase {
  policyPremium?: number;
  policyPremiumTerm?: PolicyPremiumTerm;
  policyStartDate?: string;
  policyStatus?: PolicyStatus;
  policyEndDate?: string;
  policyCoverageAmount?: number;
  transactions?: Array<{
    transactionType?: "PAYMENT" | "FEE" | "ADJUSTMENT" | "INTEREST";
  }>;
  bills?: Array<{
    totalPaymentDue?: number;
    minimumPaymentDue?: number;
    dueDate?: string;
    autoPayEnabled?: boolean;
    autoPayAmount?: number;
    autoPayDate?: string;
    pastDueAmount?: number;
    lastPaymentAmount?: number;
    lastPaymentDate?: string;
    statementBalance?: number;
    statementDate?: string;
  }>;
}

export enum AnnuityPeriod {
  NONE = "NONE",
  FIVE_YEAR = "5-YEAR",
  TEN_YEAR = "10-YEAR",
  TWENTY_YEAR = "20-YEAR",
  THIRTY_YEAR = "30-YEAR",
}

export enum AccountStatus {
  CLOSED = "CLOSED",
  DELINQUENT = "DELINQUENT",
  NEGATIVECURRENTBALANCE = "NEGATIVECURRENTBALANCE",
  OPEN = "OPEN",
  PAID = "PAID",
  PENDINGCLOSE = "PENDINGCLOSE",
  PENDINGOPEN = "PENDINGOPEN",
  RESTRICTED = "RESTRICTED",
}

export enum BalanceType {
  ASSET = "ASSET",
  LIABILITY = "LIABILITY",
}

export enum InterestRateType {
  FIXED = "FIXED",
  VARIABLE = "VARIABLE",
}

export enum BillPayStatus {
  ACTIVE = "ACTIVE",
  AVAILABLE = "AVAILABLE",
  NOT_AVAILABLE = "NOT_AVAILABLE",
  PENDING = "PENDING",
}

export enum PolicyStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  CANCELLED = "CANCELLED",
  LAPSED = "LAPSED",
  SUSPENDED = "SUSPENDED",
}

export enum PolicyPremiumTerm {
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  SEMIANNUALLY = "SEMIANNUALLY",
  ANNUALLY = "ANNUALLY",
}
export interface FdxAnnuityAccount extends FdxAccountBase {
  balanceAsOf?: string;
  currentBalance?: number;
  annuityProductType?: "CURRENCY" | "SHARES";
  annuityValueBasis?: "FIXED" | "VARIABLE";
  paymentAmount?: number;
  paymentFrequency?: FDXTimePeriod;
  paymentStartDate?: string;
  paymentEndDate?: string;
  totalPaymentCount?: number;
  netPresentValue?: number;
  annualIncrease?: number;
  annualIncreaseType?: "FIXED" | "PERCENT" | "DOLLAR";
  periodCertainGuarantee?: AnnuityPeriod;
  payoutType?: "IMMEDIATE" | "DEFERRED";
  policyProductType?: "FIXED" | "VARIABLE";
  payoutAmount?: number;
  payoutMode?: FDXTimePeriod;
  payoutStartDate?: string;
  payoutEndDate?: string;
  numberModalPayouts?: number;
  surrenderValue?: number;
  payoutChangePercentage?: number;
  payoutChangeAmount?: number;
  periodCertainType?: AnnuityPeriod;
}

export interface FdxAccountsResponse {
  accounts: Array<{
    depositAccount?: FdxDepositAccount;
    loanAccount?: FdxLoanAccount;
    locAccount?: FdxLocAccount;
    investmentAccount?: FdxInvestmentAccount;
    insuranceAccount?: FdxInsuranceAccount;
    annuityAccount?: FdxAnnuityAccount;
  }>;
  page?: {
    nextOffset?: string;
    total?: number;
    totalElements?: number;
  };
  links?: {
    next?: {
      href: string;
    };
  };
}
