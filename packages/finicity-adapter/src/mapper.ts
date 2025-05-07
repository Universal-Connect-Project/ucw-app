import { parseAddress } from "addresser";
import type {
  Account,
  AccountAchDetails,
  AccountOwner,
  AccountOwnerAddress,
  Transaction,
} from "./models";
import { parseFullName } from "parse-full-name";

function mapTransactionType(finicityType: string | undefined): string {
  const transactionTypeMapping: Record<string, string> = {
    atm: "depositTransaction",
    cash: "depositTransaction",
    check: "depositTransaction",
    credit: "locTransaction",
    debit: "locTransaction",
    deposit: "depositTransaction",
    directDebit: "loanTransaction",
    directDeposit: "depositTransaction",
    dividend: "investmentTransaction",
    fee: "depositTransaction",
    interest: "investmentTransaction",
    other: "depositTransaction",
    payment: "loanTransaction",
    pointOfSale: "locTransaction",
    repeatPayment: "loanTransaction",
    serviceCharge: "depositTransaction",
    transfer: "depositTransaction",
    withdrawal: "depositTransaction",
    default: "depositTransaction",
  };

  return transactionTypeMapping[finicityType] || transactionTypeMapping.default;
}
export function mapTransaction(transaction: Transaction, accountId: string) {
  const transactionTypeKey: string = mapTransactionType(transaction.type);
  const debitCreditMemo = transaction.amount < 0 ? "DEBIT" : "CREDIT";

  return {
    [transactionTypeKey]: {
      amount: Math.abs(transaction.amount),
      accountId,
      transactionId: `${transaction.id}`,
      postedTimestamp: new Date(transaction.postedDate),
      transactionTimestamp: new Date(transaction.transactionDate),
      description: transaction.description,
      debitCreditMemo,
      memo: transaction.memo,
      category: transaction.categorization.category,
      status: transaction.status,
      payee: transaction.categorization?.normalizedPayeeName,
    },
  };
}

interface AccountWithAchDetails extends Account {
  achDetails?: AccountAchDetails;
}

export function mapAccount(a: AccountWithAchDetails) {
  let key = "depositAccount";
  let accountCategory = "DEPOSIT_ACCOUNT";
  let balanceType;

  switch (a.type) {
    case "brokerageAccount":
    case "mortgage":
    case "loan":
    case "studentLoan":
    case "studentLoanGroup":
    case "studentLoanAccount":
      key = "loanAccount";
      accountCategory = "LOAN_ACCOUNT";
      balanceType = "LIABILITY";
      break;
    case "lineOfCredit":
    case "creditCard":
      key = "locAcount";
      accountCategory = "LOC_ACCOUNT";
      balanceType = "LIABILITY";
      break;
    case "moneyMarket":
    case "investment":
    case "investmentTaxDeferred":
    case "employeeStockPurchasePlan":
    case "ira":
    case "401k":
    case "roth":
    case "403b":
    case "529plan":
    case "529":
    case "rollover":
    case "ugma":
    case "utma":
    case "keogh":
    case "457plan":
    case "457":
    case "401a":
    case "pension":
    case "profitSharingPlan":
    case "roth401k":
    case "sepIRA":
    case "simpleIRA":
      key = "investmentAccount";
      accountCategory = "INVESTMENT_ACCOUNT";
      balanceType = "ASSET";
      break;
    case "variableAnnuity":
      key = "annuityAcount";
      accountCategory = "ANNUITY_ACCOUNT";
      balanceType = "ASSET";
      break;
    case "checking":
    case "savings":
    case "cd":
    case "cryptocurrency":
    case "educationSavings":
    case "healthSavingsAccount":
    case "thriftSavingsPlan":
    default:
      key = "depositAccount";
      accountCategory = "DEPOSIT_ACCOUNT";
      balanceType = "ASSET";
      break;
  }

  const accountDetails = a.detail;

  return {
    [key]: {
      accountId: a.id,
      accountCategory,
      accountType: a.type,
      accountNumber: a.achDetails?.realAccountNumber || a.number,
      routingTransitNumber: a.achDetails?.routingNumber,
      accountNumberDisplay: a.accountNumberDisplay,
      status: a.status,
      currency: { currencyCode: a.currency },
      balanceType,
      nickname: a.accountNickname || a.name,
      currentBalance: a.balance,
      balanceAsOf: new Date(a.balanceDate),
      availableBalance: accountDetails?.availableBalanceAmount,
      ...(accountDetails?.nextPayment !== undefined && {
        nextPaymentAmount: accountDetails.nextPayment,
      }),
      ...(accountDetails?.nextPaymentDate && {
        nextPaymentDate: new Date(accountDetails.nextPaymentDate),
      }),
      ...(accountDetails?.principalBalance !== undefined && {
        principalBalance: accountDetails.principalBalance,
      }),
      ...(accountDetails?.termOfMl && { loanTerm: accountDetails.termOfMl }),
    },
  };
}

interface AccountWithHolders extends Account {
  holders: AccountOwner[];
}

function getParsedAddress(address: AccountOwnerAddress): AccountOwnerAddress {
  if (address.line1 && address.city && address.state && address.country) {
    return address;
  } else {
    try {
      const parsedAddress = parseAddress(address.ownerAddress);
      return {
        line1: parsedAddress.addressLine1,
        city: parsedAddress.placeName,
        state: parsedAddress.stateName,
        postalCode: parsedAddress.zipCode,
      } as AccountOwnerAddress;
    } catch (Error) {
      return {
        line1: address.ownerAddress,
      } as AccountOwnerAddress;
    }
  }
}

export function transformAccountsToCustomers(
  accountsWithHolders: AccountWithHolders[],
) {
  const customersMap = new Map();

  for (const account of accountsWithHolders) {
    const { customerId, id: accountId, holders } = account;
    const accountOwner = holders[0];

    let parsedName;
    try {
      parsedName = parseFullName(
        accountOwner.ownerName,
        undefined,
        undefined,
        true,
      );
    } catch {
      parsedName = { first: accountOwner?.ownerName };
    }

    if (!customersMap.has(customerId)) {
      customersMap.set(customerId, {
        addresses: [],
        customerId: customerId,
        name: {
          first: parsedName?.first,
          last: parsedName?.last,
        },
        emails:
          accountOwner?.emails?.map((e: { email: string }) => e.email) || [],
        telephones:
          accountOwner?.phones?.map(
            (p: { phone: string; type: string; country: string }) => ({
              type: p.type,
              country: p.country,
              number: p.phone,
            }),
          ) || [],
        accounts: [],
      });
    }

    const customer = customersMap.get(customerId);

    customer.accounts.push({
      accountId: accountId,
    });

    for (const holder of holders || []) {
      for (const address of holder.addresses || []) {
        const parsedAddress = getParsedAddress(address);
        const existingAddress = customer.addresses.find(
          (a: AccountOwnerAddress) => a.line1 === parsedAddress.line1,
        );
        if (!existingAddress) {
          customer.addresses.push(parsedAddress);
        }
      }
    }
  }
  return {
    customers: Array.from(customersMap.values()),
  };
}
