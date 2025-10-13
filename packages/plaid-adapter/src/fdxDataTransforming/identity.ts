import {
  FdxCustomer,
  DeliveryAddressType,
  AccountHolderRelationship,
  Iso3166CountryCode,
  PhoneType,
  FdxCustomerType,
  FdxCustomerName,
  FdxIdentityResponse,
} from "@repo/utils-dev-dependency/shared/FdxDataTypes";

import { parseFullName } from "parse-full-name";

interface PlaidIdentityResponse {
  accounts: Array<{
    account_id: string;
    balances: {
      available: number | null;
      current: number | null;
      iso_currency_code: string;
      limit: number | null;
      unofficial_currency_code: string | null;
    };
    holder_category?: "personal" | "business";
    mask: string;
    name: string;
    official_name: string | null;
    owners: Array<{
      addresses: Array<{
        data: {
          city: string;
          country: string;
          postal_code: string;
          region: string;
          street: string;
        };
        primary: boolean;
      }>;
      emails: Array<{
        data: string;
        primary: boolean;
        type: string;
      }>;
      names: string[];
      phone_numbers: Array<{
        data: string;
        primary: boolean;
        type: string;
      }>;
    }>;
    subtype: string;
    type: string;
  }>;
  item: {
    available_products: string[];
    billed_products: string[];
    consent_expiration_time: string | null;
    consented_products: string[];
    error: unknown;
    institution_id: string;
    institution_name: string;
    item_id: string;
    products: string[];
    update_type: string;
    webhook: string;
  };
  request_id: string;
}

const mapPhoneType = (plaidType: string): PhoneType => {
  switch (plaidType.toLowerCase()) {
    case "home":
      return "HOME";
    case "work":
    case "office":
      return "BUSINESS";
    case "mobile":
    case "mobile1":
      return "CELL";
    case "other":
    default:
      return "HOME";
  }
};

const mapAddressType = (primary: boolean): DeliveryAddressType => {
  return primary ? "HOME" : "MAILING";
};

const parseName = (
  nameString: string,
  isBusinessAccount?: boolean,
): FdxCustomerName => {
  const parsed = parseFullName(nameString);

  if (isBusinessAccount) {
    return {
      company: nameString.trim(),
    };
  }

  return {
    ...(parsed.title && { prefix: parsed.title }),
    first: parsed.first || "",
    ...(parsed.middle && { middle: parsed.middle }),
    last: parsed.last || "",
    ...(parsed.suffix && { suffix: parsed.suffix }),
  };
};

const getAccountRelationship = (
  holderCategory?: string,
): AccountHolderRelationship => {
  return holderCategory === "business"
    ? AccountHolderRelationship.BUSINESS
    : AccountHolderRelationship.PRIMARY;
};

/**
 * Transforms Plaid identity response to FDX customer format
 */
export const transformPlaidIdentityToFdxCustomers = (
  plaidResponse: PlaidIdentityResponse,
): FdxIdentityResponse => {
  const customerMap = new Map<string, FdxCustomer>();

  plaidResponse.accounts.forEach((account) => {
    account.owners?.forEach((owner, ownerIndex) => {
      // Create a unique customer ID based on the primary identity information
      const customerId = `${plaidResponse.item.item_id}_owner_${ownerIndex}`;

      if (!customerMap.has(customerId)) {
        const primaryName = owner.names[0] || "";
        const isBusinessAccount = account.holder_category === "business";
        const parsedName = parseName(primaryName, isBusinessAccount);

        const customerType: FdxCustomerType = isBusinessAccount
          ? FdxCustomerType.BUSINESS
          : FdxCustomerType.CONSUMER;

        const addresses = owner.addresses.map((addr) => ({
          type: mapAddressType(addr.primary),
          line1: addr.data.street,
          city: addr.data.city,
          region: addr.data.region,
          postalCode: addr.data.postal_code,
          country: addr.data.country as Iso3166CountryCode,
        }));

        const telephones = owner.phone_numbers.map((phone) => ({
          type: mapPhoneType(phone.type),
          number: phone.data,
        }));

        const emails = owner.emails.map((email) => email.data);

        const customer: FdxCustomer = {
          customerId,
          type: customerType,
          name: parsedName,
          email: emails,
          addresses,
          telephones,
          accounts: [],
        };

        customerMap.set(customerId, customer);
      }

      const customer = customerMap.get(customerId);
      if (customer) {
        customer.accounts.push({
          accountId: account.account_id,
          relationship: getAccountRelationship(account.holder_category),
          links: [],
        });
      }
    });
  });

  return { customers: Array.from(customerMap.values()) };
};
