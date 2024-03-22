# Universal Connect Widget (Application)

This repo is a full stack application which anyone can clone and self-host as a way to serve the connect widget via a url which can then be loaded into an iframe.

## Getting Started (in production)

*Coming soon* - A dockerized version of this project will be available soon, on Dockerhub.

## Getting Started (in development)
1. clone the repo
2. copy .env.example
3. Follow Initial setup for getting environment variables
4. run `docker-compose up`

## Initial setup
1. Run `npm run keys` to generate a new set of `key` and `IV` values.
2. Fill in the `CryptoKey` and `CryptoIv` in your newly created `.env` file with the generated `key` and `IV`.
3. Sign up for a UCP client account: [here](https://login.universalconnectproject.org/) (the `Click here to login` link navigates to the aws hosted login page where sign up option is available).
4. Generate and view your client secrets once registered and logged in
5. Fill in the `UcpAuthClientId`, `UcpAuthClientSecret` and `UcpAuthEncryptionKey` in the `.env` file with the values provided by login page.

*Please remember that secrets are passed through environment variables instead of hardcoded in the js file.*
DO NOT put any credentials in any of the js files. If you do so, it could accidentally get committed and leaked to the public.
USE `.env` FILE

*UCP credentials are required for authentication and secret exchange, storage (redis-like session cache) and analytics services.*

*The `CryptoKey` and `CryptoIv` values are for encrypting the session token in order to not rely on cookies. They must be shared across server instances if there are multiple instances.*

* You might see an error about failure to connect redis, the widget doesn't rely on redis to start, but some providers logic require an redis intance, to fix this error you can either: 
- start a local redis instance, this way it will be avaliable at localhost:6379 and the widget will use it
- Or set in `.env` Env=dev, this way the redis client will use local in-mem object to handle the cache and remove the error, however, this is just for some testing, the cached values won't expire and also will be cleared on server restart. 
