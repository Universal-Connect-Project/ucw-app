import { http, HttpResponse } from 'msw'
import { server } from '../test/testServer'
import { ProviderApiBase } from './index'
import { createClient } from '../__mocks__/redis'
import { ConnectionStatus, OAuthStatus } from '../../src/shared/contract'
import { READ_MEMBER_STATUS_PATH } from '../test/handlers'
import { MxApi } from './mx'

const redisMock = createClient()
const testConnectionId = 'test_connection_id'

const mxApi = new MxApi(
  {
    mxProd: {
      username: 'testUsername',
      password: 'testPassword'
    },
    storageClient: redisMock
  },
  false
)

const providerApiBase = new ProviderApiBase({
  context: {
    provider: 'mx',
    auth: {
      token: 'test_token',
      iv: 'test_iv'
    },
    resolved_user_id: 'test_user_id'
  }
})

describe('ProviderApiBase', () => {
  describe('getOauthState', () => {
    beforeAll(async () => {
      await providerApiBase.init()
      providerApiBase.serviceClient = mxApi
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

      expect(await providerApiBase.getOauthState(testConnectionId)).toEqual({
        oauth_state: {
          guid: 'test_connection_id',
          inbound_member_guid: 'test_connection_id',
          outbound_member_guid: 'test_connection_id',
          auth_status: OAuthStatus.PENDING
        }
      })
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

      expect(await providerApiBase.getOauthState(testConnectionId)).toEqual({
        oauth_state: {
          guid: 'test_connection_id',
          inbound_member_guid: 'test_connection_id',
          outbound_member_guid: 'test_connection_id',
          auth_status: OAuthStatus.COMPLETE
        }
      })
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

      expect(await providerApiBase.getOauthState(testConnectionId)).toEqual({
        oauth_state: {
          guid: 'test_connection_id',
          inbound_member_guid: 'test_connection_id',
          outbound_member_guid: 'test_connection_id',
          auth_status: OAuthStatus.ERROR,
          error_reason: ConnectionStatus.DENIED
        }
      })
    })
  })
})
