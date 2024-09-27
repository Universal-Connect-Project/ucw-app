import * as dotenv from "dotenv";

export const init = (path = ".env") => {
  const result: dotenv.DotenvConfigOutput = dotenv.config({
    path
  });

  if (result.error) {
    throw result.error;
  }

  const { parsed: envs } = result;

  // Validate envs

  if (!envs?.HostUrl) {
    throw new Error("Missing HostUrl. Check README.md and `../.env.example` for more info.");
  }

  if (!envs?.MxClientId && !envs?.MxClientIdProd) {
    throw new Error("Missing MxClientId or MxClientIdProd. Check README.md and `../.env.example` for more info.");
  }

  if (!envs?.MxApiSecret && !envs?.MxApiSecretProd) {
    throw new Error("Missing MxApiSecret or MxApiSecretProd. Check README.md and `../.env.example` for more info.");
  }

  return {
    HostUrl: envs?.HostUrl,
    MxClientId: envs?.MxClientId,
    MxApiSecret: envs?.MxApiSecret,
    MxClientIdProd: envs?.MxClientIdProd,
    MxApiSecretProd: envs?.MxApiSecretProd
  };
};

export default init();