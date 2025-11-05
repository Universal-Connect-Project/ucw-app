import { parseAddress } from "addresser";
import type {
  Account,
  AccountHolder,
  AccountAddress,
  Transaction,
} from "./models";
import { parseFullName } from "parse-full-name";

export function mapTransaction(transaction: Transaction, accountId: string) {
  const transactionTypeKey = 'depositTransaction';
  const debitCreditMemo = transaction.Debit > 0 ? "DEBIT" : "CREDIT";

  return {
    [transactionTypeKey]: {
      amount: transaction.Debit || transaction.Credit,
      accountId,
      transactionId: `${transaction.Id}`,
      postedTimestamp: new Date(transaction.Date),
      transactionTimestamp: new Date(transaction.Date),
      description: transaction.Description,
      debitCreditMemo,
    },
  };
}

export function mapAccount(a: Account) {
  let key = "depositAccount";
  let accountCategory = "DEPOSIT_ACCOUNT";
  let balanceType;

  switch (a.Type) {
    case "brokerageAccount":
    case "studentLoanAccount":
      key = "loanAccount";
      accountCategory = "LOAN_ACCOUNT";
      balanceType = "LIABILITY";
      break;
    case "creditCard":
      key = "locAcount";
      accountCategory = "LOC_ACCOUNT";
      balanceType = "LIABILITY";
      break;
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
    case "Chequing":
    default:
      key = "depositAccount";
      accountCategory = "DEPOSIT_ACCOUNT";
      balanceType = "ASSET";
      break;
  }

  return {
    [key]: {
      accountId: a.Id,
      accountCategory,
      accountType: a.Type,
      accountNumber: a.AccountNumber,
      routingTransitNumber: a.TransitNumber,
      accountNumberDisplay: a.LastFourDigits,
      // status: a.status,
      currency: a.Currency,
      balanceType,
      nickname: a.Title,
      currentBalance: a.Balance.Available || a.Balance.Current,
      balanceAsOf: new Date(), //?
      availableBalance:a.Balance.Available,
    }
  };
}

export function transformAccountsToCustomers(
  accountsWithHolders: Account[],
) {

  const ret = [];
  for (const account of accountsWithHolders) {
    let parsedName;
    try {
      parsedName = parseFullName(
        account.Holder.Name,
        undefined,
        undefined,
        true,
      );
    } catch {
      parsedName = { first: account.Holder.Name };
    }

    const cus = {
      addresses: [{
        line1: account.Holder.Address.CivicAddress,
        city: account.Holder.Address.City,
        state: account.Holder.Address.Province,
        country: account.Holder.Address.Country,
      }],
      customerId: account.Id,
      name: {
        first: parsedName?.first,
        last: parsedName?.last,
      },
      emails:[account.Holder.Email],
      telephones: [{
        type: '',
        country: account.Holder.Address.Country,
        number: account.Holder.PhoneNumber,
      }],
      accounts: [mapAccount(account)],
    };
    ret.push(cus);
  }
  return ret;
}
