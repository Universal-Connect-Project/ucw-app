import { Iso3166CountryCode, IsoDateString } from "./common";

export interface FdxCustomerName {
  prefix?: string;
  company?: string;
  first?: string;
  middle?: string;
  last?: string;
  suffix?: string;
}

/**
 * Industry Classification System containing the industry code for customer.
 *
 * | Value | Description |
 * |-------|-------------|
 * | BCLASS | Bloomberg Classification System |
 * | BICS | Bloomberg Industry Classification System |
 * | GICS | Global Industry Classification System |
 * | MOODYS | Moody's Industry Classification |
 * | NAICS | North American Industry Classification System |
 * | OTHER | Any other set of industry classification codes |
 * | SIC | Standard Industry Classification system |
 */
export type IndustryClassificationSystem =
  | "BCLASS"
  | "BICS"
  | "GICS"
  | "MOODYS"
  | "NAICS"
  | "OTHER"
  | "SIC";

export interface FdxAddress {
  line1: string;
  line2?: string;
  line3?: string;
  city: string;
  state?: string; // deprecated
  region: string;
  postalCode: string;
  country: Iso3166CountryCode;
}

export type DeliveryAddressType = "BUSINESS" | "DELIVERY" | "HOME" | "MAILING";

export interface FdxDeliveryAddress extends FdxAddress {
  type?: DeliveryAddressType;
}

export enum AccountHolderRelationship {
  AUTHORIZED_USER = "AUTHORIZED_USER",
  BUSINESS = "BUSINESS",
  FOR_BENEFIT_OF = "FOR_BENEFIT_OF",
  FOR_BENEFIT_OF_PRIMARY = "FOR_BENEFIT_OF_PRIMARY",
  FOR_BENEFIT_OF_PRIMARY_JOINT_RESTRICTED = "FOR_BENEFIT_OF_PRIMARY_JOINT_RESTRICTED",
  FOR_BENEFIT_OF_SECONDARY = "FOR_BENEFIT_OF_SECONDARY",
  FOR_BENEFIT_OF_SECONDARY_JOINT_RESTRICTED = "FOR_BENEFIT_OF_SECONDARY_JOINT_RESTRICTED",
  FOR_BENEFIT_OF_SOLE_OWNER_RESTRICTED = "FOR_BENEFIT_OF_SOLE_OWNER_RESTRICTED",
  POWER_OF_ATTORNEY = "POWER_OF_ATTORNEY",
  PRIMARY_JOINT_TENANTS = "PRIMARY_JOINT_TENANTS",
  PRIMARY = "PRIMARY",
  PRIMARY_BORROWER = "PRIMARY_BORROWER",
  PRIMARY_JOINT = "PRIMARY_JOINT",
  SECONDARY = "SECONDARY",
  SECONDARY_JOINT_TENANTS = "SECONDARY_JOINT_TENANTS",
  SECONDARY_BORROWER = "SECONDARY_BORROWER",
  SECONDARY_JOINT = "SECONDARY_JOINT",
  SOLE_OWNER = "SOLE_OWNER",
  TRUSTEE = "TRUSTEE",
  UNIFORM_TRANSFER_TO_MINOR = "UNIFORM_TRANSFER_TO_MINOR",
}

export type PhoneType = "BUSINESS" | "CELL" | "FAX" | "HOME";

export enum FdxCustomerType {
  CONSUMER = "CONSUMER",
  BUSINESS = "BUSINESS",
}

export interface FdxCustomer {
  customerId: string;
  type: FdxCustomerType;
  name: FdxCustomerName;
  dateOfBirth?: IsoDateString;
  taxId?: string;
  taxIdCountry?: Iso3166CountryCode;
  governmentId?: string;
  businessCustomer?: {
    name: string;
    registeredAgents?: FdxCustomerName[];
    registeredId?: string;
    industryCode?: {
      code: string;
      type: IndustryClassificationSystem;
    };
    domicile?: {
      country: Iso3166CountryCode;
      region?: string;
    };
  };
  email: string[];
  addresses: FdxDeliveryAddress[];
  telephones: Array<{
    type: PhoneType;
    country?: string;
    number: string;
  }>;
  customerStartDate?: IsoDateString;
  lastActivityDate?: IsoDateString;
  accounts: Array<{
    accountId: string;
    relationship: AccountHolderRelationship;
    links: Array<{
      rel: string;
      href: string;
      action?: string;
      types?: string[];
    }>;
  }>;
}

export interface FdxIdentityResponse {
  customers: FdxCustomer[];
}
