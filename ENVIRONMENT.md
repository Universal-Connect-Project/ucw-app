# Environment variables

These are the environment variables that can be set in apps/server/env/(staging|production).env

## Suggested variables

| Variable name      | Description                                                                                                                                                                                                                                    | Examples                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| ELASTIC_SEARCH_URL | The url of the elastic search server                                                                                                                                                                                                           | http://localhost:9200              |
| ENV                | The server will behave differently depending on this variable. For instance test institutions won't show up when env is prod. And it will target production services for things like institution list and performance.                         | dev, test, prod                    |
| HOST_URL           | The base url of the server                                                                                                                                                                                                                     | http://localhost:8080              |
| LOG_LEVEL          | The level of logs that should be outputted                                                                                                                                                                                                     | debug, trace, info, warning, error |
| PORT               | The port where the server runs                                                                                                                                                                                                                 | 8080                               |
| REDIS_SERVER       | The url of the redis server                                                                                                                                                                                                                    | redis://localhost:6379             |
| WEBHOOK_HOST_URL   | The webhook base url for adapters with webhooks (should be the same as HOST_URL)                                                                                                                                                               |                                    |
| UCP_CLIENT_ID      | Client ID, available in the (UCP dashboard)[https://app.universalconnectproject.org/widget-management]. Providing these api keys will sync the latest data(institutions, performance, etc.) to the widget and provide performance data to UCP. |
| UCP_CLIENT_SECRET  | Client Secret, available in the (UCP dashboard)[https://app.universalconnectproject.org/widget-management]                                                                                                                                     |

## Aggregator specific variables

| Variable name            | Description                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------- |
| MX_API_SECRET            | The client secret for MX integration APIs found in the MX dashboard (API Key)       |
| MX_API_SECRET_PROD       | The client secret for MX production APIs found in the MX dashboard (API Key)        |
| MX_CLIENT_ID             | The client id for MX integration APIs found in the MX dashboard (Client Id)         |
| MX_CLIENT_ID_PROD        | The client id for MX production APIs found in the MX dashboard (Client Id)          |
| SOPHTRON_API_USER_ID     | The user id for Sophtron APIs found at sophtron.com/Manage -> UserId                |
| SOPHTRON_API_USER_SECRET | The user secret Sophtron APIs found at sophtron.com/Manage -> AccessKey             |
| FINICITY_PARTNER_ID      | The integration partner id for Finicity                                             |
| FINICITY_APP_KEY         | The integration app key for Finicity                                                |
| FINICITY_SECRET          | The integration secret for Finicity                                                 |
| FINICITY_PARTNER_ID_PROD | The production partner id for Finicity                                              |
| FINICITY_APP_KEY_PROD    | The production app key for Finicity                                                 |
| FINICITY_SECRET_PROD     | The production secret for Finicity                                                  |
| AKOYA_CLIENT_ID          | The client id for akoya sandbox integration found in the akoya dashboard            |
| AKOYA_CLIENT_ID_PROD     | The client id for the akoya production integration found in the akoya dashboard     |
| AKOYA_SECRET             | The client secret for the akoya sandbox integration found in the akoya dashboard    |
| AKOYA_SECRET_PROD        | The client secret for the akoya production integration found in the akoya dashboard |
| PLAID_CLIENT_NAME        | The name that's displayed in the Plaid Link widget                                  |
| PLAID_CLIENT_ID          | The client ID for the Plaid integration found in the Plaid dashboard                |
| PLAID_SECRET             | The secret for the Plaid sandbox integration found in the Plaid dashboard           |
| PLAID_SECRET_PROD        | The secret for the Plaid production integration found in the Plaid dashboard        |

## Optional variables

| Variable name                | Description                                                    | Examples | Default value   |
| ---------------------------- | -------------------------------------------------------------- | -------- | --------------- |
| INSTITUTION_POLLING_INTERVAL | How frequently in minutes the institution list should update   | 1        | 1               |
| REDIS_CACHE_TIME_SECONDS     | The default expiration of things stored in redis               | 600      | 600             |
| REDIS_ENABLE_TLS             | Enables TLS (Useful for some deployment platforms like heroku) | true     | false/undefined |
| ELASTIC_SEARCH_SINGLE_THREAD | Enables single-threaded Elasticsearch indexing/updating        | true     | undefined       |

## Local development variables

| Variable name   | Description                                                           | Examples | Default value |
| --------------- | --------------------------------------------------------------------- | -------- | ------------- |
| NGROK_AUTHTOKEN | Auth token from NGROK to be able to run finicity in local development |          |               |

## Authentication variables

| Variable name                       | Description                                                                                                                                                                             | Examples    | Default value |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------- |
| AUTHENTICATION_ENABLE               | Whether or not to enable our optional authentication on most endpoints other than the data endpoints                                                                                    | true, false | false         |
| AUTHENTICATION_AUDIENCE             | Authentication variable for our optional authentication                                                                                                                                 |             |               |
| AUTHENTICATION_ISSUER_BASE_URL      | Authentication variable for our optional authentication                                                                                                                                 |             |               |
| AUTHENTICATION_TOKEN_SIGNING_ALG    | Authentication variable for our optional authentication                                                                                                                                 |             |               |
| AUTHENTICATION_SCOPES               | Authentication variable for our optional authentication                                                                                                                                 |             |               |
| AUTHORIZATION_TOKEN_COOKIE_SAMESITE | Sets the `sameSite` value for the authorization token cookie. If your widget will be embedded in a domain different from the widget's domain, change this from the default of `strict`. | strict      | strict        |

## Data endpoint variables

| Variable name                                  | Description                                                                                                                                                                                                                                 | Examples    | Default value |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------- |
| DATA_ENDPOINTS_ENABLE                          | Whether or not to add data endpoints to the express server. We don't recommend turning these on unless you have special authentication around them. Users could access other users' data without proper security attached to the endpoints. | true, false | false         |
| DATA_ENDPOINT_AUTHENTICATION_ENABLE            | Whether or not to enable our optional authentication on the data endpoints                                                                                                                                                                  | true, false | false         |
| DATA_ENDPOINT_AUTHENTICATION_AUDIENCE          | Authentication variable for our optional data endpoint authentication                                                                                                                                                                       |             |               |
| DATA_ENDPOINT_AUTHENTICATION_ISSUER_BASE_URL   | Authentication variable for our optional data endpoint authentication                                                                                                                                                                       |             |               |
| DATA_ENDPOINT_AUTHENTICATION_TOKEN_SIGNING_ALG | Authentication variable for our optional data endpoint authentication                                                                                                                                                                       |             |               |
| DATA_ENDPOINT_AUTHENTICATION_SCOPES            | Authentication variable for our optional data endpoint authentication                                                                                                                                                                       |             |               |

## Delete User endpoint variables

| Variable name                                         | Description                                                                      | Examples    | Default value |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- | ----------- | ------------- |
| DELETE_USER_ENDPOINT_ENABLE                           | Whether or not to add the delete user endpoint to the express server.            | true, false | false         |
| DELETE_USER_ENDPOINT_AUTHENTICATION_ENABLE            | Whether or not to enable our optional authentication on the delete user endpoint | true, false | false         |
| DELETE_USER_ENDPOINT_AUTHENTICATION_AUDIENCE          | Authentication variable for our optional delete user endpoint authentication     |             |               |
| DELETE_USER_ENDPOINT_AUTHENTICATION_ISSUER_BASE_URL   | Authentication variable for our optional delete user endpoint authentication     |             |               |
| DELETE_USER_ENDPOINT_AUTHENTICATION_TOKEN_SIGNING_ALG | Authentication variable for our optional delete user endpoint authentication     |             |               |
| DELETE_USER_ENDPOINT_AUTHENTICATION_SCOPES            | Authentication variable for our optional delete user endpoint authentication     |             |               |

## Proxy server network variables (Optional)

| Variable name  | Description                                            | Examples               | Default value |
| -------------- | ------------------------------------------------------ | ---------------------- | ------------- |
| PROXY_HOST     | The host of your proxy server                          | velodrome.usefixie.com | undefined     |
| PROXY_PORT     | The port of your proxy server                          | 80                     | undefined     |
| PROXY_USERNAME | The username for authentication into your proxy server | userName               | undefined     |
| PROXY_PASSWORD | The password for authentication into your proxy server | Xdfew643               | undefined     |
