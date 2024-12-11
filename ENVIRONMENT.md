# Environment variables

This is an explanation of some of the environment variables that can be set in `./apps/server/.env`

## UCP Credentials

These values are necessary in order for your instance of the UCW to interact with the UCP-hosted services, such as the
Preferences service and Institutions service

| Variable name     | Description                                   |
|-------------------|-----------------------------------------------|
| UCP_CLIENT_ID     | Client ID, available in the UCP dashboard     |
| UCP_CLIENT_SECRET | Client Secret, available in the UCP dashboard |

## Suggested variables

| Variable name              | Description                                                                                                                  | Examples                                     |
|----------------------------|------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------|
| ELASTIC_SEARCH_URL         | The url of the elastic search server                                                                                         | http://localhost:9200                        |
| ENV                        | The server will behave differently depending on this variable. For instance test institutions won't show up when env is prod | dev, test, prod                              |
| HOST_URL                   | The base url of the server                                                                                                   | http://localhost:8080                        |
| INSTITUTION_CACHE_LIST_URL | The url to poll for institutions                                                                                             | http://localhost:8088/institutions/cacheList |
| LOG_LEVEL                  | The level of logs that should be outputted                                                                                   | debug, trace, info, warning, error           |
| PORT                       | The port where the server runs                                                                                               | 8080                                         |
| REDIS_SERVER               | The url of the redis server                                                                                                  | redis://localhost:6379                       |

## Aggregator specific variables

| Variable name            | Description                                                                   |
|--------------------------|-------------------------------------------------------------------------------|
| MX_API_SECRET            | The client secret for MX integration APIs found in the MX dashboard (API Key) |
| MX_API_SECRET_PROD       | The client secret for MX production APIs found in the MX dashboard (API Key)  |
| MX_CLIENT_ID             | The client id for MX integration APIs found in the MX dashboard (Client Id)   |
| MX_CLIENT_ID_PROD        | The client id for MX production APIs found in the MX dashboard (Client Id)    |
| SOPHTRON_API_USER_ID     | The user id for Sophtron APIs found at sophtron.com/Manage -> UserId          |
| SOPHTRON_API_USER_SECRET | The user secret Sophtron APIs found at sophtron.com/Manage -> AccessKey       |

## Optional variables

| Variable name                | Description                                                  | Examples | Default value |
|------------------------------|--------------------------------------------------------------|----------|---------------|
| INSTITUTION_POLLING_INTERVAL | How frequently in minutes the institution list should update | 1        | 1             |
| REDIS_CACHE_TIME_SECONDS     | The default expiration of things stored in redis             | 600      | 600           |

## Authentication variables

| Variable name                    | Description                                                                                          | Examples    | Default value |
|----------------------------------|------------------------------------------------------------------------------------------------------|-------------|---------------|
| AUTHENTICATION_ENABLE            | Whether or not to enable our optional authentication on most endpoints other than the data endpoints | true, false | false         |
| AUTHENTICATION_AUDIENCE          | Authentication variable for our optional authentication                                              |             |               |
| AUTHENTICATION_ISSUER_BASE_URL   | Authentication variable for our optional authentication                                              |             |               |
| AUTHENTICATION_TOKEN_SIGNING_ALG | Authentication variable for our optional authentication                                              |             |               |
| AUTHENTICATION_SCOPES            | Authentication variable for our optional authentication                                              |             |               |

## Data endpoint variables

| Variable name                                  | Description                                                                                                                                                                                                                                 | Examples    | Default value |
|------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|---------------|
| DATA_ENDPOINTS_ENABLE                          | Whether or not to add data endpoints to the express server. We don't recommend turning these on unless you have special authentication around them. Users could access other users' data without proper security attached to the endpoints. | true, false | false         |
| DATA_ENDPOINT_AUTHENTICATION_ENABLE            | Whether or not to enable our optional authentication on the data endpoints                                                                                                                                                                  | true, false | false         |
| DATA_ENDPOINT_AUTHENTICATION_AUDIENCE          | Authentication variable for our optional data endpoint authentication                                                                                                                                                                       |             |               |
| DATA_ENDPOINT_AUTHENTICATION_ISSUER_BASE_URL   | Authentication variable for our optional data endpoint authentication                                                                                                                                                                       |             |               |
| DATA_ENDPOINT_AUTHENTICATION_TOKEN_SIGNING_ALG | Authentication variable for our optional data endpoint authentication                                                                                                                                                                       |             |               |
| DATA_ENDPOINT_AUTHENTICATION_SCOPES            | Authentication variable for our optional data endpoint authentication                                                                                                                                                                       |             |               |

## Delete User endpoint variables

| Variable name                                         | Description                                                                      | Examples    | Default value |
|-------------------------------------------------------|----------------------------------------------------------------------------------|-------------|---------------|
| DELETE_USER_ENDPOINT_ENABLE                           | Whether or not to add the delete user endpoint to the express server.            | true, false | false         |
| DELETE_USER_ENDPOINT_AUTHENTICATION_ENABLE            | Whether or not to enable our optional authentication on the delete user endpoint | true, false | false         |
| DELETE_USER_ENDPOINT_AUTHENTICATION_AUDIENCE          | Authentication variable for our optional delete user endpoint authentication     |             |               |
| DELETE_USER_ENDPOINT_AUTHENTICATION_ISSUER_BASE_URL   | Authentication variable for our optional delete user endpoint authentication     |             |               |
| DELETE_USER_ENDPOINT_AUTHENTICATION_TOKEN_SIGNING_ALG | Authentication variable for our optional delete user endpoint authentication     |             |               |
| DELETE_USER_ENDPOINT_AUTHENTICATION_SCOPES            | Authentication variable for our optional delete user endpoint authentication     |             |               |
