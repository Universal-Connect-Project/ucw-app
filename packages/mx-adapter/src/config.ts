import * as dotenv from "dotenv";

export const init = (path = ".env") => {
  const result: dotenv.DotenvConfigOutput = dotenv.config({
    path
  });

  if (result.error) {
    throw result.error;
  }

  const { parsed: envs } = result;

  if (
    !(
      envs?.HOST_URL &&
      (!(
        envs?.MX_CLIENT_ID &&
        envs?.MX_API_SECRET
      ) || !(
        envs?.MX_CLIENT_ID_PROD &&
        envs?.MX_API_SECRET_PROD
      ))
    )
  ) {
    throw new Error(
      "Missing required environment variables. Check README.md and `../.env.example` for more info."
    );
  }

  return {
    HOST_URL: envs?.HOST_URL,
    MX_CLIENT_ID: envs?.MX_CLIENT_ID,
    MX_API_SECRET: envs?.MX_API_SECRET,
    MX_CLIENT_ID_PROD: envs?.MX_CLIENT_ID_PROD,
    MX_API_SECRET_PROD: envs?.MX_API_SECRET_PROD
  };
};

export default init();