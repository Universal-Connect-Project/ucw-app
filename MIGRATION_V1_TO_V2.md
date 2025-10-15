## Data Endpoints

### start_time, end_time

- start_time and end_time are no longer valid params for requesting transactions using the built in data endpoints
- startDate and endDate are not new params but they are the only valid params now. Use format YYYY-MM-DD like 2025-01-10 for January 10th, 2025

## Postmessages

### Response object name changes

- `member_guid` -> `connectionId`
- `user_guid` -> `aggregatorUserId`
- `connection_status` -> `connectionStatus`

Example `connect/memberStatusUpdate`:

```json
{
  "metadata": {
    "ucpInstitutionId": "finbank",
    "connectionStatus": 6,
    "connectionId": "8041339803",
    "aggregatorUserId": "8054956163",
    "aggregator": "finicity_sandbox"
  },
  "type": "connect/memberStatusUpdate"
}
```

Example `connect/memberConnected` object:

```json
{
  "metadata": {
    "ucpInstitutionId": "plaidbank",
    "connectionId": "access-sandbox-111111-22222-33333-44444-555555",
    "aggregatorUserId": "tester301",
    "aggregator": "plaid_sandbox"
  },
  "type": "connect/memberConnected"
}
```
