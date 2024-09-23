import { http, HttpResponse } from 'msw'
import { ConnectionStatus, OAuthStatus } from '../shared/contract'
import { READ_MEMBER_STATUS_PATH } from '../test/handlers'
import { server } from '../test/testServer'
import { AggregatorAdapterBase } from './index'
import { MxAdapter } from './mx'

const testConnectionId = 'test_connection_id'

const isIntEnv = false
const mxAdapter = new MxAdapter(isIntEnv)

const aggregatorAdapterBase = new AggregatorAdapterBase({
  context: {
    aggregator: 'mx',
    auth: {
      token: 'test_token',
      iv: 'test_iv'
    },
    resolved_user_id: 'test_user_id'
  }
})

describe('AggregatorAdapterBase', () => {
  describe('getOauthState', () => {
    beforeAll(async () => {
      await aggregatorAdapterBase.init()
      aggregatorAdapterBase.aggregatorAdapter = mxAdapter
    })

    it('returns a pending oauth state', async () => {
      server.use(
        http.get(READ_MEMBER_STATUS_PATH, () =>
          HttpResponse.json({
            member: {
              connection_status: 'PENDING',
              guid: 'memberStatusGuid'
            }
          })
        )
      )

      expect(await aggregatorAdapterBase.getOauthState(testConnectionId)).toEqual(
        {
          oauth_state: {
            guid: 'test_connection_id',
            inbound_member_guid: 'test_connection_id',
            outbound_member_guid: 'test_connection_id',
            auth_status: OAuthStatus.PENDING
          }
        }
      )
    })

    it('returns a connected oauth state', async () => {
      server.use(
        http.get(READ_MEMBER_STATUS_PATH, () =>
          HttpResponse.json({
            member: {
              connection_status: 'CONNECTED',
              guid: 'memberStatusGuid'
            }
          })
        )
      )

      expect(await aggregatorAdapterBase.getOauthState(testConnectionId)).toEqual(
        {
          oauth_state: {
            guid: 'test_connection_id',
            inbound_member_guid: 'test_connection_id',
            outbound_member_guid: 'test_connection_id',
            auth_status: OAuthStatus.COMPLETE
          }
        }
      )
    })

    it('returns an errored oauth state', async () => {
      server.use(
        http.get(READ_MEMBER_STATUS_PATH, () =>
          HttpResponse.json({
            member: {
              connection_status: 'DENIED',
              guid: 'memberStatusGuid'
            }
          })
        )
      )

      expect(await aggregatorAdapterBase.getOauthState(testConnectionId)).toEqual(
        {
          oauth_state: {
            guid: 'test_connection_id',
            inbound_member_guid: 'test_connection_id',
            outbound_member_guid: 'test_connection_id',
            auth_status: OAuthStatus.ERROR,
            error_reason: ConnectionStatus.DENIED
          }
        }
      )
    })
  })
})
