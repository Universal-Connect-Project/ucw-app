export const createFakeAccessToken = ({
  expiresInSeconds,
}: {
  expiresInSeconds: number;
}) => {
  const dateInMillisecs = Date.now();

  const headers = {
    alg: "RS256",
    typ: "JWT",
    kid: "l0NUw2KQif_eSkGv73Qk3",
  };
  const payload = {
    iss: "https://auth-staging.universalconnectproject.org/",
    sub: "sub",
    aud: "ucp-widget-interactions",
    iat: 1741816827,
    exp: Math.round(dateInMillisecs / 1000) + expiresInSeconds,
    scope: "read:widget-endpoints write:widget-endpoints",
    gty: "client-credentials",
    permissions: [] as string[],
  };
  const publicKey = {
    e: "AQAB",
    kty: "RSA",
    n: "fake-key",
  };
  const jwt = [
    btoa(JSON.stringify(headers)),
    btoa(JSON.stringify(payload)),
    btoa(JSON.stringify(publicKey)),
  ].join(".");

  return jwt;
};
