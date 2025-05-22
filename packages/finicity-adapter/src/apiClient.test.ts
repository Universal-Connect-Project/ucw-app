import { customerData } from "./test/testData/users";
import FinicityClient, {
  BASE_PATH,
  FINICITY_TOKEN_REDIS_KEY,
} from "./apiClient";
import {
  createClient as createCacheClient,
  createLogClient,
} from "@repo/utils/test";
import { server } from "./test/testServer";
import { http, HttpResponse } from "msw";
import {
  CREATE_USER_PATH,
  MOCKED_FIX_OAUTH_URL,
  MOCKED_OAUTH_URL,
} from "./test/handlers";
import { accountTransactionsData } from "./test/testData/accounts";

const cacheClient = createCacheClient();
const logger = createLogClient();

const mockApiCredentials = {
  partnerId: "testPartnerId",
  appKey: "testAppKey",
  secret: "testSecret",
};

const mockEnvConfig = {
  HostUrl: "http://test.universalconnect.org",
};

const mockGetWebhookHostUrl = () => "http://test.webhook.url";

const apiClient = new FinicityClient(
  false,
  { finicitySandbox: mockApiCredentials, finicityProd: mockApiCredentials },
  logger,
  mockEnvConfig,
  mockGetWebhookHostUrl,
  cacheClient,
);

describe("FinicityClient", () => {
  describe("getAuthToken", () => {
    it("retrieves and caches the token", async () => {
      const token = await apiClient.getAuthToken();
      expect(token).toEqual("mocked-token");

      const cachedToken = await cacheClient.get(FINICITY_TOKEN_REDIS_KEY);
      expect(cachedToken).toEqual("mocked-token");
    });
  });

  describe("createCustomer", () => {
    it("creates a customer and returns the customer ID", async () => {
      const customer = await apiClient.createCustomer("test-user-name");
      expect(customer.id).toEqual("createdNewCustomerId");
    });

    it("throws an error for invalid user data", async () => {
      server.use(
        http.post(CREATE_USER_PATH, async () => {
          return HttpResponse.json({ error: "Failed" }, { status: 400 });
        }),
      );

      await expect(apiClient.createCustomer("invalid-user")).rejects.toThrow();
    });
  });

  describe("getCustomers", () => {
    it("retrieves a customer by username", async () => {
      const customer = await apiClient.getCustomers("test-user-name");
      expect(customer.id).toEqual(customerData.customers[0].id);
    });

    it("returns undefined if no customer is found", async () => {
      server.use(
        http.get(`${BASE_PATH}/aggregation/v1/customers`, () => {
          return HttpResponse.json({ customers: [] });
        }),
      );

      const customer = await apiClient.getCustomers("nonExistingUserId");
      expect(customer).toBeUndefined();
    });
  });

  describe("refreshAccountsToAggregateTransactions", () => {
    it("refreshes accounts for a given customer ID", async () => {
      const response =
        await apiClient.refreshAccountsToAggregateTransactions(
          "testCustomerId",
        );
      expect(response).toEqual({ success: true });
    });
  });

  describe("generateConnectLiteUrl", () => {
    it("generates a Connect Lite URL", async () => {
      const url = await apiClient.generateConnectLiteUrl(
        "testInstitutionId",
        "testCustomerId",
        "test-request-id",
      );
      expect(url).toEqual(MOCKED_OAUTH_URL);
    });
  });

  describe("generateConnectFixUrl", () => {
    it("generates a Connect Fix URL", async () => {
      const url = await apiClient.generateConnectFixUrl(
        "testInstitutionLoginId",
        "testCustomerId",
        "testConnectSessionId",
      );
      expect(url).toEqual(MOCKED_FIX_OAUTH_URL);
    });
  });

  describe("getCustomer", () => {
    it("retrieves a customer by ID successfully", async () => {
      const customerId = customerData.customers[0].id;

      const customer = await apiClient.getCustomer(customerId);
      expect(customer).toEqual(
        expect.objectContaining({
          id: customerId,
          username: "test-user-name",
        }),
      );
    });

    it("falls back to getCustomers if direct retrieval fails", async () => {
      const username = "test-user-name";

      server.use(
        http.get(`${BASE_PATH}/aggregation/v1/customers/${username}`, () =>
          HttpResponse.json({ error: "Customer not found" }, { status: 404 }),
        ),
      );

      server.use(
        http.get(`${BASE_PATH}/aggregation/v1/customers`, ({ request }) => {
          const searchParams = new URL(request.url).searchParams;
          const queriedUsername = searchParams.get("username");
          if (queriedUsername === username) {
            return HttpResponse.json({
              customers: [{ id: "fallbackCustomerId", username }],
            });
          }
          return HttpResponse.json({ customers: [] });
        }),
      );

      const customer = await apiClient.getCustomer(username);
      expect(customer).toEqual(
        expect.objectContaining({
          id: "fallbackCustomerId",
          username,
        }),
      );
    });

    it("returns undefined if the customer is not found in both methods", async () => {
      const username = "nonExistingUser";

      server.use(
        http.get(`${BASE_PATH}/aggregation/v1/customers/${username}`, () =>
          HttpResponse.json({ error: "Customer not found" }, { status: 404 }),
        ),
      );

      server.use(
        http.get(`${BASE_PATH}/aggregation/v1/customers`, ({ request }) => {
          const searchParams = new URL(request.url).searchParams;
          const queriedUsername = searchParams.get("username");
          if (queriedUsername === username) {
            return HttpResponse.json({ customers: [] });
          }
          return HttpResponse.json({ customers: [] });
        }),
      );

      const customer = await apiClient.getCustomer(username);
      expect(customer).toBeUndefined();
    });
  });

  describe("getTransactions", () => {
    it("retrieves transactions for a given customer ID, account ID, and date range and includes pending transactions.", async () => {
      const customerId = "testCustomerId";
      const accountId = "testAccountId";
      const fromDate = "2023-01-01";
      const toDate = "2023-01-31";
      let requestedFromDate: string;
      let requestedToDate: string;
      let includePendingParamExists = false;

      server.use(
        http.get(
          `${BASE_PATH}/aggregation/v4/customers/${customerId}/accounts/${accountId}/transactions`,
          ({ request }) => {
            const searchParams = new URL(request.url).searchParams;
            requestedFromDate = searchParams.get("fromDate");
            requestedToDate = searchParams.get("toDate");
            includePendingParamExists = !!searchParams.get("includePending");
            return HttpResponse.json(accountTransactionsData);
          },
        ),
      );

      const transactions = await apiClient.getTransactions(
        customerId,
        accountId,
        fromDate,
        toDate,
      );

      expect(transactions).toEqual(accountTransactionsData.transactions);
      expect(requestedFromDate).toEqual(fromDate);
      expect(requestedToDate).toEqual(toDate);
      expect(includePendingParamExists).toBeTruthy();
    });

    it("returns an empty array if no transactions are found", async () => {
      const customerId = "testCustomerId";
      const accountId = "testAccountId";
      const fromDate = "2023-02-01";
      const toDate = "2023-02-28";

      server.use(
        http.get(
          `${BASE_PATH}/aggregation/v4/customers/${customerId}/accounts/${accountId}/transactions`,
          () =>
            HttpResponse.json({
              found: 0,
              displaying: 0,
              moreAvailable: false,
              fromDate: 1607450357,
              toDate: 1607450357,
              sort: "desc",
              transactions: [],
            }),
        ),
      );

      const transactions = await apiClient.getTransactions(
        customerId,
        accountId,
        fromDate,
        toDate,
      );

      expect(transactions).toEqual([]);
    });
  });

  describe("deleteCustomer", () => {
    it("deletes a customer successfully", async () => {
      const customerId = "testCustomerId";

      await expect(apiClient.deleteCustomer(customerId)).resolves.not.toThrow();
    });

    it("throws an error if the customer does not exist", async () => {
      const customerId = "nonExistingCustomerId";

      server.use(
        http.delete(`${BASE_PATH}/aggregation/v1/customers/${customerId}`, () =>
          HttpResponse.json(
            { message: "Error deleting customer" },
            { status: 404 },
          ),
        ),
      );

      await expect(apiClient.deleteCustomer(customerId)).rejects.toThrow(
        "Error deleting customer",
      );
    });
  });
});
