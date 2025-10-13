import { transformPlaidIdentityToFdxCustomers } from "./identity";
import {
  FdxCustomerType,
  AccountHolderRelationship,
} from "@repo/utils-dev-dependency/shared/FdxDataTypes";
import { identityResponse } from "@repo/utils-dev-dependency/plaid/testData";

// Helper to convert test data to expected interface
const mockPlaidIdentityResponse = identityResponse as unknown as Parameters<
  typeof transformPlaidIdentityToFdxCustomers
>[0];

describe("transformPlaidIdentityToFdxCustomers", () => {
  it("transforms the standard test data correctly", () => {
    const result = transformPlaidIdentityToFdxCustomers(
      mockPlaidIdentityResponse,
    );

    expect(result.customers).toHaveLength(1);
    expect(result.customers[0]).toEqual({
      customerId: `${identityResponse.item.item_id}_owner_0`,
      type: FdxCustomerType.CONSUMER,
      name: {
        first: "Alberta",
        middle: "Bobbeth",
        last: "Charleson",
      },
      email: [
        "accountholder0@example.com",
        "accountholder1@example.com",
        "extraordinarily.long.email.username.123456@reallylonghostname.com",
      ],
      addresses: [
        {
          type: "HOME",
          line1: "2992 Cameron Road",
          city: "Malakoff",
          region: "NY",
          postalCode: "14236",
          country: "US",
        },
        {
          type: "MAILING",
          line1: "2493 Leisure Lane",
          city: "San Matias",
          region: "CA",
          postalCode: "93405-2255",
          country: "US",
        },
      ],
      telephones: [
        {
          type: "HOME",
          number: "1112223333",
        },
        {
          type: "BUSINESS",
          number: "1112224444",
        },
        {
          type: "CELL",
          number: "1112225555",
        },
      ],
      accounts: expect.arrayContaining([
        expect.objectContaining({
          accountId: expect.any(String),
          relationship: expect.any(String),
          links: [],
        }),
      ]),
    });
  });

  it("handles business accounts with company names", () => {
    const businessResponse = {
      ...mockPlaidIdentityResponse,
      accounts: [
        {
          ...mockPlaidIdentityResponse.accounts[0],
          holder_category: "business" as const,
          owners: [
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              names: ["Acme Corporation LLC"],
            },
          ],
        },
      ],
    };

    const result = transformPlaidIdentityToFdxCustomers(businessResponse);

    expect(result.customers[0].type).toBe(FdxCustomerType.BUSINESS);
    expect(result.customers[0].name).toEqual({
      company: "Acme Corporation LLC",
    });
    expect(result.customers[0].accounts[0].relationship).toBe(
      AccountHolderRelationship.BUSINESS,
    );
  });

  it("handles names with prefixes and suffixes", () => {
    const nameVariationsResponse = {
      ...mockPlaidIdentityResponse,
      accounts: [
        {
          ...mockPlaidIdentityResponse.accounts[0],
          owners: [
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              names: ["Dr. John Michael Smith Jr."],
            },
          ],
        },
      ],
    };

    const result = transformPlaidIdentityToFdxCustomers(nameVariationsResponse);

    expect(result.customers[0].name).toEqual({
      prefix: "Dr.",
      first: "John",
      middle: "Michael",
      last: "Smith",
      suffix: "Jr.",
    });
  });

  it("handles various name formats", () => {
    const multiOwnerResponse = {
      ...mockPlaidIdentityResponse,
      accounts: [
        {
          ...mockPlaidIdentityResponse.accounts[0],
          owners: [
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              names: ["John"],
            },
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              names: ["Jane Doe"],
            },
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              names: ["Ms. Sarah Elizabeth Brown"],
            },
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              names: ["Robert Johnson III"],
            },
          ],
        },
      ],
    };

    const result = transformPlaidIdentityToFdxCustomers(multiOwnerResponse);

    expect(result.customers).toHaveLength(4);

    // Single name (treated as last name by parse-full-name)
    expect(result.customers[0].name).toEqual({
      first: "",
      last: "John",
    });

    // First and last name
    expect(result.customers[1].name).toEqual({
      first: "Jane",
      last: "Doe",
    });

    // Name with prefix and middle name
    expect(result.customers[2].name).toEqual({
      prefix: "Ms.",
      first: "Sarah",
      middle: "Elizabeth",
      last: "Brown",
    });

    // Name with suffix
    expect(result.customers[3].name).toEqual({
      first: "Robert",
      last: "Johnson",
      suffix: "III",
    });
  });

  it("maps phone number types correctly", () => {
    const phoneTypesResponse = {
      ...mockPlaidIdentityResponse,
      accounts: [
        {
          ...mockPlaidIdentityResponse.accounts[0],
          owners: [
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              phone_numbers: [
                { data: "1111111111", primary: true, type: "home" },
                { data: "2222222222", primary: false, type: "work" },
                { data: "3333333333", primary: false, type: "office" },
                { data: "4444444444", primary: false, type: "mobile" },
                { data: "5555555555", primary: false, type: "mobile1" },
                { data: "6666666666", primary: false, type: "other" },
              ],
            },
          ],
        },
      ],
    };

    const result = transformPlaidIdentityToFdxCustomers(phoneTypesResponse);
    const phoneTypes = result.customers[0].telephones.map((t) => t.type);

    expect(phoneTypes).toEqual([
      "HOME",
      "BUSINESS",
      "BUSINESS",
      "CELL",
      "CELL",
      "HOME",
    ]);
  });

  it("maps address types correctly (primary vs non-primary)", () => {
    const addressTypesResponse = {
      ...mockPlaidIdentityResponse,
      accounts: [
        {
          ...mockPlaidIdentityResponse.accounts[0],
          owners: [
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              addresses: [
                {
                  data: {
                    city: "Primary City",
                    country: "US",
                    postal_code: "12345",
                    region: "ST",
                    street: "123 Primary St",
                  },
                  primary: true,
                },
                {
                  data: {
                    city: "Secondary City",
                    country: "US",
                    postal_code: "67890",
                    region: "ST",
                    street: "456 Secondary Ave",
                  },
                  primary: false,
                },
              ],
            },
          ],
        },
      ],
    };

    const result = transformPlaidIdentityToFdxCustomers(addressTypesResponse);

    expect(result.customers[0].addresses[0].type).toBe("HOME");
    expect(result.customers[0].addresses[1].type).toBe("MAILING");
  });

  it("handles multiple accounts with same owner", () => {
    const multiAccountResponse = {
      ...mockPlaidIdentityResponse,
      accounts: [
        {
          ...mockPlaidIdentityResponse.accounts[0],
          account_id: "account-1",
        },
        {
          ...mockPlaidIdentityResponse.accounts[0],
          account_id: "account-2",
          holder_category: "business" as const,
        },
      ],
    };

    const result = transformPlaidIdentityToFdxCustomers(multiAccountResponse);

    expect(result.customers).toHaveLength(1);
    expect(result.customers[0].accounts).toHaveLength(2);
    expect(result.customers[0].accounts[0].accountId).toBe("account-1");
    expect(result.customers[0].accounts[1].accountId).toBe("account-2");
    expect(result.customers[0].accounts[0].relationship).toBe(
      AccountHolderRelationship.PRIMARY,
    );
    expect(result.customers[0].accounts[1].relationship).toBe(
      AccountHolderRelationship.BUSINESS,
    );
  });

  it("handles empty or missing data gracefully", () => {
    const minimalResponse = {
      ...mockPlaidIdentityResponse,
      accounts: [
        {
          ...mockPlaidIdentityResponse.accounts[0],
          owners: [
            {
              addresses: [],
              emails: [],
              names: [""],
              phone_numbers: [],
            },
          ],
        },
      ],
    };

    const result = transformPlaidIdentityToFdxCustomers(minimalResponse);

    expect(result.customers).toHaveLength(1);
    expect(result.customers[0].name).toEqual({
      first: "",
      last: "",
    });
    expect(result.customers[0].email).toEqual([]);
    expect(result.customers[0].addresses).toEqual([]);
    expect(result.customers[0].telephones).toEqual([]);
  });

  it("generates unique customer IDs for different owners", () => {
    const multiOwnerResponse = {
      ...mockPlaidIdentityResponse,
      accounts: [
        {
          ...mockPlaidIdentityResponse.accounts[0],
          owners: [
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              names: ["Owner One"],
            },
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              names: ["Owner Two"],
            },
          ],
        },
      ],
    };

    const result = transformPlaidIdentityToFdxCustomers(multiOwnerResponse);

    expect(result.customers).toHaveLength(2);
    expect(result.customers[0].customerId).toBe(
      `${identityResponse.item.item_id}_owner_0`,
    );
    expect(result.customers[1].customerId).toBe(
      `${identityResponse.item.item_id}_owner_1`,
    );
  });

  it("handles business accounts with person names correctly", () => {
    const businessPersonResponse = {
      ...mockPlaidIdentityResponse,
      accounts: [
        {
          ...mockPlaidIdentityResponse.accounts[0],
          holder_category: "business" as const,
          owners: [
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              names: ["John Smith"],
            },
          ],
        },
      ],
    };

    const result = transformPlaidIdentityToFdxCustomers(businessPersonResponse);

    expect(result.customers[0].type).toBe(FdxCustomerType.BUSINESS);
    // For business accounts, we always use the company field regardless of name format
    expect(result.customers[0].name).toEqual({
      company: "John Smith",
    });
  });

  it("preserves all email addresses", () => {
    const multiEmailResponse = {
      ...mockPlaidIdentityResponse,
      accounts: [
        {
          ...mockPlaidIdentityResponse.accounts[0],
          owners: [
            {
              ...mockPlaidIdentityResponse.accounts[0].owners[0],
              emails: [
                { data: "email1@example.com", primary: true, type: "personal" },
                { data: "email2@example.com", primary: false, type: "work" },
                { data: "email3@example.com", primary: false, type: "other" },
              ],
            },
          ],
        },
      ],
    };

    const result = transformPlaidIdentityToFdxCustomers(multiEmailResponse);

    expect(result.customers[0].email).toEqual([
      "email1@example.com",
      "email2@example.com",
      "email3@example.com",
    ]);
  });
});
