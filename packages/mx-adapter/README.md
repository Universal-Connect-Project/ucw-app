# MX Adapter for the UCW

This is the adapter that makes it possible to connect with MX via the Universal Connect Widget.

## Installation

This package is meant to be used with the Universal Connect Widget. If you have forked the UCW project, you can install it as a dependency of the widget.

Navigate to your forked project and, from the root of the project, run:

```bash
npm i @ucp-npm/mx-adapter --workspace apps/server
```
## Usage

Once you have the npm package installed, you can set up the ucw to use it.

In the `./apps/server/adapterSetup.ts` file, do the following:

Import the `adapterMapObject` for mx:

```typescript
import { getMxAdapterMapObject as mxAdapterMapObject } from "@ucp-npm/mx-adapter";
```

Also import the cache client, and logger:

```typescript
import { get, set } from "./services/storageClient/redis";
import * as logger from "./infra/logger";
```

Next, look for the line that starts with `export const adapterMap = {`, and add the adapter map as follows:

```typescript
export const adapterMap = {
  ...mxAdapterMapObject({
    cacheClient: {
      set: set,
      get: get,
    },
    logClient: logger,
    aggregatorCredentials: {
      mxInt: aggregatorCredentials.mxInt,
      mxProd: aggregatorCredentials.mxProd,
    },
    envConfig: {
      HOSTURL: config.HOST_URL,
      MXCLIENTID: config.MXCLIENTID,
      MXAPISECRET: config.MXAPISECRET,
      MXCLIENTIDPROD: config.MXCLIENTIDPROD,
      MXAPISECRETPROD: config.MXAPISECRETPROD,
    },
  }),
  ...testAdapterMapObject,
};
````

The dependencies `cacheClient` and `logClient` are provided by the Universal Connect Widget.

## Contributing

You will need to set up ENV vars in order to run the adapter tests. 

Copy the example env file, and fill in your own values.
```bash
  cp ./packages/mx-adapter/.env.example ./packages/mx-adapter/.env.test
```

## More Info

See [https://universalconnectproject.org/](https://universalconnectproject.org/) for more information.

## NPM Published Package

https://www.npmjs.com/package/@ucp-npm/mx-adapter
