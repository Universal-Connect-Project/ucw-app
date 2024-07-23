import { http, HttpResponse } from 'msw'
import { ConnectionStatus, OAuthStatus } from '../shared/contract'
import { READ_MEMBER_STATUS_PATH } from '../test/handlers'
import { server } from '../test/testServer'
import { getProviderAdapter, ProviderAdapterBase } from './index'
import { MxAdapter } from './mx'

const testConnectionId = 'test_connection_id'

const isIntEnv = false
const mxAdapter = new MxAdapter(isIntEnv)

const providerAdapterBase = new ProviderAdapterBase({
  context: {
    provider: 'mx',
    auth: {
      token: 'test_token',
      iv: 'test_iv'
    },
    resolved_user_id: 'test_user_id'
  }
})

describe('ProviderAdapterBase', () => {
  describe('getProviderAdapter', () => {
    it('throws an error if its an unsupported provider', async () => {
      expect(() => getProviderAdapter('junk')).toThrow(
        'Unsupported provider junk'
      )
    })
  })

  describe('getOauthState', () => {
    beforeAll(async () => {
      await providerAdapterBase.init()
      providerAdapterBase.providerAdapter = mxAdapter
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

      expect(await providerAdapterBase.getOauthState(testConnectionId)).toEqual(
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

      expect(await providerAdapterBase.getOauthState(testConnectionId)).toEqual(
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

      expect(await providerAdapterBase.getOauthState(testConnectionId)).toEqual(
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
