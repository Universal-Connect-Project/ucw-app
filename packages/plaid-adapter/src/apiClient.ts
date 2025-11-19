import { ApiResponse, ComboJobTypes } from "@repo/utils";

interface CreateGetOauthUrlParams {
  sandbox: boolean;
  clientName: string;
  clientId: string;
  secret: string;
  userId: string;
  webhookHostUrl: string;
  jobTypes: ComboJobTypes[];
  state: string;
}

interface PlaidToken {
  link_token: string;
  expiration: Date;
  request_id: string;
  hosted_link_url: string;
}

export const PLAID_BASE_PATH = "https://sandbox.plaid.com";
export const PLAID_BASE_PATH_PROD = "https://production.plaid.com";

const handleApiResponse = async (
  response: Response,
  genericErrorMsg: string,
) => {
  if (!response.ok) {
    let errorMessage = genericErrorMsg;
    try {
      const errorJson = (await response.json()) as { error_message?: string };
      errorMessage = errorJson.error_message || genericErrorMsg;
    } catch {
      // JSON parsing failed, but we already know the response was not ok
      // Keep the default error message
    }
    throw new Error(errorMessage);
  }

  let json;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error(
      `Response was successful but contained invalid JSON. ${genericErrorMsg}`,
    );
  }

  return {
    status: response.status,
    data: json,
  };
};

export async function createPlaidLinkToken({
  sandbox,
  clientName,
  clientId,
  secret,
  userId,
  webhookHostUrl,
  jobTypes,
  state,
}: CreateGetOauthUrlParams): Promise<PlaidToken> {
  const basePath = sandbox ? PLAID_BASE_PATH : PLAID_BASE_PATH_PROD;
  const aggregator = sandbox ? "plaid_sandbox" : "plaid";

  const completion_redirect_uri = `${webhookHostUrl}/oauth/${aggregator}/redirect_from?connection_id=${state}`;
  const webhook = `${webhookHostUrl}/webhook/${aggregator}/?connection_id=${state}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {
    client_name: clientName,
    language: "en",
    country_codes: ["US"],
    user: {
      client_user_id: userId,
    },
    webhook,
    products: [],
    hosted_link: {
      completion_redirect_uri,
    },
  };

  if (jobTypes.includes(ComboJobTypes.TRANSACTION_HISTORY)) {
    body.transactions = {
      days_requested: 730,
    };
    body.products.push("transactions");
  } else if (jobTypes.includes(ComboJobTypes.TRANSACTIONS)) {
    body.transactions = {
      days_requested: 90,
    };
    body.products.push("transactions");
  }
  if (jobTypes.includes(ComboJobTypes.ACCOUNT_OWNER)) {
    body.products.push("identity");
  }
  if (jobTypes.includes(ComboJobTypes.ACCOUNT_NUMBER)) {
    body.products.push("auth");
  }
  const response = await fetch(basePath + "/link/token/create", {
    method: "POST",
    headers: {
      "PLAID-CLIENT-ID": clientId,
      "PLAID-SECRET": secret,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await response.json()) as PlaidToken;
}

/**
 * Exchanges a Plaid temporary public token for a permanent access token.
 *
 * @param params - The parameters for the token exchange.
 * @param params.publicToken - The public token received from Plaid Link (30 minute expiration).
 * @param params.clientId - The Plaid client ID.
 * @param params.secret - The Plaid secret.
 * @returns A promise that resolves to an object containing the access token and item ID.
 * @throws Will throw an error if the token exchange fails.
 */
export const publicTokenExchange = async ({
  publicToken,
  clientId,
  secret,
  sandbox,
}: {
  publicToken: string;
  clientId: string;
  secret: string;
  sandbox: boolean;
}): Promise<{ access_token: string; item_id: string }> => {
  const basePath = sandbox ? PLAID_BASE_PATH : PLAID_BASE_PATH_PROD;

  const response = await fetch(basePath + "/item/public_token/exchange", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      public_token: publicToken,
    }),
  });

  if (!response.ok) {
    throw new Error("Error exchanging public token");
  }

  return (await response.json()) as { access_token: string; item_id: string };
};

export async function removeItem({
  accessToken,
  clientId,
  secret,
  sandbox,
}: {
  accessToken: string;
  clientId: string;
  secret: string;
  sandbox: boolean;
}): Promise<ApiResponse> {
  const basePath = sandbox ? PLAID_BASE_PATH : PLAID_BASE_PATH_PROD;

  const response = await fetch(basePath + "/item/remove", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      access_token: accessToken,
    }),
  });

  return await handleApiResponse(response, "Error removing Item");
}

export async function getItem({
  accessToken,
  clientId,
  secret,
  sandbox,
}: {
  accessToken: string;
  clientId: string;
  secret: string;
  sandbox: boolean;
}): Promise<ApiResponse> {
  const basePath = sandbox ? PLAID_BASE_PATH : PLAID_BASE_PATH_PROD;

  const response = await fetch(basePath + "/item/get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      access_token: accessToken,
    }),
  });

  return await handleApiResponse(response, "Error getting Item");
}

export async function getAuth({
  accessToken,
  clientId,
  secret,
  sandbox,
}: {
  accessToken: string;
  clientId: string;
  secret: string;
  sandbox: boolean;
}): Promise<ApiResponse> {
  const basePath = sandbox ? PLAID_BASE_PATH : PLAID_BASE_PATH_PROD;

  const response = await fetch(basePath + "/auth/get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      access_token: accessToken,
    }),
  });

  return await handleApiResponse(response, "Error getting account numbers");
}

export async function getAccounts({
  accessToken,
  clientId,
  secret,
  sandbox,
}: {
  accessToken: string;
  clientId: string;
  secret: string;
  sandbox: boolean;
}): Promise<ApiResponse> {
  const basePath = sandbox ? PLAID_BASE_PATH : PLAID_BASE_PATH_PROD;

  const response = await fetch(basePath + "/accounts/get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      access_token: accessToken,
    }),
  });

  return await handleApiResponse(response, "Error getting accounts");
}

export async function getIdentity({
  accessToken,
  clientId,
  secret,
  sandbox,
}: {
  accessToken: string;
  clientId: string;
  secret: string;
  sandbox: boolean;
}): Promise<ApiResponse> {
  const basePath = sandbox ? PLAID_BASE_PATH : PLAID_BASE_PATH_PROD;

  const response = await fetch(basePath + "/identity/get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      secret,
      access_token: accessToken,
    }),
  });

  return await handleApiResponse(response, "Error getting identity");
}

export async function getTransactions({
  accessToken,
  clientId,
  secret,
  sandbox,
  accountIds,
  startDate,
  endDate,
}: {
  accessToken: string;
  clientId: string;
  secret: string;
  sandbox: boolean;
  accountIds?: string[];
  startDate: string; // Format: YYYY-MM-DD
  endDate: string; // Format: YYYY-MM-DD
}): Promise<ApiResponse> {
  const basePath = sandbox ? PLAID_BASE_PATH : PLAID_BASE_PATH_PROD;

  const body = {
    client_id: clientId,
    secret,
    access_token: accessToken,
    start_date: startDate,
    end_date: endDate,
    options: {
      count: 500, // maximum allowed by Plaid
      ...(accountIds && { account_ids: accountIds }),
    },
  };

  const response = await fetch(basePath + "/transactions/get", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return await handleApiResponse(response, "Error getting transactions");
}
