import { URL, URLSearchParams } from "url";

export const AKOYA_BASE_PATH = "https://sandbox-idp.ddp.akoya.com";
export const AKOYA_BASE_PROD_PATH = "https://idp.ddp.akoya.com";

interface CreateGetOauthUrlParams {
  sandbox: boolean;
  clientId: string;
  hostUrl: string;
  institutionId: string;
  state: string;
}

export function createGetOauthUrl({
  sandbox,
  clientId,
  hostUrl,
  institutionId,
  state,
}: CreateGetOauthUrlParams): string {
  const basePath = sandbox ? AKOYA_BASE_PATH : AKOYA_BASE_PROD_PATH;
  const aggregator = sandbox ? "akoya_sandbox" : "akoya";

  const client_redirect_url = `${hostUrl}/oauth/${aggregator}/redirect_from`;

  const params = {
    connector: institutionId,
    client_id: clientId,
    redirect_uri: client_redirect_url,
    state: state,
    response_type: "code",
    scope: "openid profile offline_access",
  };

  const baseUrl = new URL("/auth", basePath);
  baseUrl.search = new URLSearchParams(params).toString();

  return baseUrl.toString();
}
