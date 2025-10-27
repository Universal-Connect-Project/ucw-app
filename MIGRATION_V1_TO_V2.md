## Data Endpoints

### start_time, end_time

- start_time and end_time are no longer valid params for requesting transactions using the built in data endpoints
- startDate and endDate are not new params but they are the only valid params now. Use format YYYY-MM-DD like 2025-01-10 for January 10th, 2025

## Postmessages

### Security

- Because Plaid sends an access_token in the memberConnected postmessage it's now required to pass targetOrigin into the widget url request.

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

### Data Endpoints

The endpoints have changed to improve security and to be more compatible with different aggregators.

#### URL Structure and Security Changes

**BREAKING CHANGE**: The endpoint URLs have been completely restructured for security and simplicity.

**Before V2** - Complex path-based URLs:

- `/api/data/aggregator/:aggregator/user/:userId/connection/:connectionId/accounts`
- `/api/data/aggregator/:aggregator/user/:userId/connection/:connectionId/identity`
- `/api/data/aggregator/:aggregator/user/:userId/account/:accountId/transactions`
- `/api/vc/data/aggregator/:aggregator/user/:userId/connection/:connectionId/accounts`
- `/api/vc/data/aggregator/:aggregator/user/:userId/connection/:connectionId/identity`
- `/api/vc/data/aggregator/:aggregator/user/:userId/account/:accountId/transactions`

**After V2** - Simple query parameter URLs with secure headers:

- `/api/data/accounts`
- `/api/data/identity`
- `/api/data/transactions`
- `/api/vc/data/accounts`
- `/api/vc/data/identity`
- `/api/vc/data/transactions`

**Security Enhancement**: The sensitive `connectionId` has been moved from the URL path to a secure HTTP header (`UCW-Connection-Id`) to prevent it from appearing in server logs, browser history, or referrer headers.

#### Userless Aggregator Support

**NEW FEATURE**: Some aggregators (like Plaid) are now classified as "userless" and have different validation rules.

For **userless aggregators** (currently `plaid` and `plaid_sandbox`):

- The `userId` parameter is **optional** for all endpoints
- This allows accessing data using only the connection ID without requiring a user ID

For **traditional aggregators** (MX, Sophtron, Finicity):

- The `userId` parameter remains **required** for all endpoints

#### Transactions Endpoint Changes

The transactions endpoint maintains its existing validation but now also uses the secure header approach:

- `accountId` - **Required**
- `aggregator` - **Required**
- `userId` - **Required**
- `startDate` - Optional, must be in ISO 8601 format (YYYY-MM-DD)
- `endDate` - Optional, must be in ISO 8601 format (YYYY-MM-DD)
- `UCW-Connection-Id` - **Required** (moved to header)

#### Request Examples

**Before V2** (accounts endpoint):

```http
GET /api/data/aggregator/mx/user/user123/connection/conn456/accounts
```

**After V2** (accounts endpoint):

```http
GET /api/data/accounts?aggregator=mx&userId=user123
UCW-Connection-Id: conn456
```

**Before V2** (transactions endpoint):

```http
GET /api/data/aggregator/mx/user/user123/account/acc789/transactions?startTime=2025-10-10&endTime=2025-10-25
```

**After V2** (transactions endpoint):

```http
GET /api/data/transactions?aggregator=mx&userId=user123&accountId=acc789?startTime=2025-10-10&endTime=2025-10-25
UCW-Connection-Id: conn456
```

**V2 Userless aggregator example** (Plaid accounts):

```http
GET /api/data/accounts?aggregator=plaid
UCW-Connection-Id: access-sandbox-111111-22222-33333-44444-555555
```
