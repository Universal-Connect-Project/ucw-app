export const getAccessToken = async (request) => {
  const response = await request.post(
    `https://auth-staging.universalconnectproject.org/oauth/token`,
    {
      data: {
        audience: "ucp-hosted-apps",
        client_id: process.env.UCP_CLIENT_ID as string,
        grant_type: "password",
        password: process.env.UCP_PASSWORD as string,
        username: process.env.UCP_USERNAME as string,
      },
    },
  );

  return (await response.json()).access_token;
};
