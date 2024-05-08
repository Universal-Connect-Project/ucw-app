import { http, HttpResponse } from 'msw'
import { server } from '../test/testServer'
import { FinicityApi } from './finicity'
import { finicityInsitutionData } from '../test/testData/institution'
import { FINICITY_CONNECT_LITE_URL, DELETE_CUSTOMER_PATH, READ_CUSTOMER_PATH } from '../test/handlers'
import { clearRedisMock, createClient, getRedisStorageObject } from '../__mocks__/redis'
import { ConnectionStatus } from '../shared/contract'
import { finicityReadCustomerData } from '../test/testData/users'

const token = 'testToken'

const redisMock = createClient()

const finicityApi = new FinicityApi({
  finicitySandbox: {
    partnerId: 'testPartnerId',
    appKey: 'testAppKey',
    secret: 'testSecret',
    basePath: 'https://api.finicity.com',
    provider: 'finicity_sandbox'
  },
  storageClient: redisMock,
  token
}, true)

const institutionResponse = finicityInsitutionData.institution

describe('finicity provider', () => {
  describe('FinicityApi', () => {
    describe('GetInstitutionById', () => {
      it('gets institution data correctly', async () => {
        expect(await finicityApi.GetInstitutionById('testId')).toEqual({
          id: 'testId',
          logo_url: institutionResponse.branding.icon,
          name: institutionResponse.name,
          oauth: true, // this is hardcoded true because finicity has an external widget we use
          url: institutionResponse.urlHomeApp,
          provider: 'finicity_sandbox'
        })
      })
    })

    describe('CreateConnection', () => {
      afterEach(() => {
        clearRedisMock()
      })

      it('generates object with connect lite url', async () => {
        const response = await finicityApi.CreateConnection({
          institution_id: 'testInstitutionId',
          credentials: []
        }, 'testUserId')

        const expectedResponse = {
          id: response.id,
          is_oauth: true,
          user_id: 'testUserId',
          credentials: [] as any,
          institution_code: 'testInstitutionId',
          oauth_window_uri: FINICITY_CONNECT_LITE_URL,
          provider: 'finicity_sandbox',
          status: ConnectionStatus.PENDING
        }

        expect(getRedisStorageObject()[response.id]).toEqual(expectedResponse)
        expect(response).toEqual(expectedResponse)
      })
    })

    describe('DeleteConnection', () => {
      it('deletes the connection', async () => {
        let connectionDeletionAttempted = false
        redisMock.set('testId', 'something')

        server.use(http.delete(DELETE_CUSTOMER_PATH, () => {
          connectionDeletionAttempted = true

          return new HttpResponse(null, {
            status: 200
          })
        }))

        await finicityApi.DeleteConnection('testId', 'testUserId')

        expect(connectionDeletionAttempted).toBe(true)
        expect(getRedisStorageObject().testId).toBe(null)
      })
    })

    describe('ResolveUserId', () => {
      describe('when a finicity customer already exists', () => {
        it('returns the user id of the existing customer', async () => {
          server.use(http.get(READ_CUSTOMER_PATH, () => HttpResponse.json(finicityReadCustomerData)))

          expect(await finicityApi.ResolveUserId('testUserId')).toEqual('finicityTestUser')
        })
      })

      describe('when a finicity customer does NOT exist', () => {
        it('creates a new customer and returns the ID', async () => {
          server.use(http.get(READ_CUSTOMER_PATH, () => new HttpResponse(null, {
            status: 200
          })))

          expect(await finicityApi.ResolveUserId('testUserId')).toEqual('createdFinicityUserId')
        })
      })
    })
  })
})
