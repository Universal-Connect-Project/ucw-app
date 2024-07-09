import { http, HttpResponse } from 'msw'
import { get, set } from '../services/storageClient/redis'
import { ConnectionStatus } from '../shared/contract'
import {
  DELETE_CUSTOMER_PATH,
  FINICITY_CONNECT_LITE_URL,
  READ_CUSTOMER_PATH
} from '../test/handlers'
import { finicityInsitutionData } from '../test/testData/institution'
import { finicityReadCustomerData } from '../test/testData/users'
import { server } from '../test/testServer'
import { FinicityAdapter } from './finicity'

const finicityApi = new FinicityAdapter()

const institutionResponse = finicityInsitutionData.institution

describe('finicity provider', () => {
  describe('FinicityAdapter', () => {
    describe('GetInstitutionById', () => {
      it('gets institution data correctly', async () => {
        expect(await finicityApi.GetInstitutionById('testId')).toEqual({
          id: 'testId',
          logo_url: institutionResponse.branding.icon,
          name: institutionResponse.name,
          oauth: true, // this is hardcoded true because finicity has an external widget we use
          url: institutionResponse.urlHomeApp,
          provider: 'finicity'
        })
      })
    })

    describe('CreateConnection', () => {
      it('generates object with connect lite url', async () => {
        const response = await finicityApi.CreateConnection(
          {
            institution_id: 'testInstitutionId',
            credentials: []
          },
          'testUserId'
        )

        const expectedResponse = {
          id: response.id,
          is_oauth: true,
          user_id: 'testUserId',
          credentials: [] as any,
          institution_code: 'testInstitutionId',
          oauth_window_uri: FINICITY_CONNECT_LITE_URL,
          provider: 'finicity',
          status: ConnectionStatus.PENDING
        }

        expect(await get(response.id)).toEqual(expectedResponse)
        expect(response).toEqual(expectedResponse)
      })
    })

    describe('DeleteConnection', () => {
      it('deletes the connection', async () => {
        let connectionDeletionAttempted = false
        await set('testId', 'something')

        server.use(
          http.delete(DELETE_CUSTOMER_PATH, () => {
            connectionDeletionAttempted = true

            return new HttpResponse(null, {
              status: 200
            })
          })
        )

        await finicityApi.DeleteConnection('testId', 'testUserId')

        expect(connectionDeletionAttempted).toBe(true)
        expect(await get('testId')).toBe(null)
      })
    })

    describe('ResolveUserId', () => {
      describe('when a finicity customer already exists', () => {
        it('returns the user id of the existing customer', async () => {
          server.use(
            http.get(READ_CUSTOMER_PATH, () =>
              HttpResponse.json(finicityReadCustomerData)
            )
          )

          expect(await finicityApi.ResolveUserId('testUserId')).toEqual(
            'finicityTestUser'
          )
        })
      })

      describe('when a finicity customer does NOT exist', () => {
        it('creates a new customer and returns the ID', async () => {
          server.use(
            http.get(
              READ_CUSTOMER_PATH,
              () =>
                new HttpResponse(null, {
                  status: 200
                })
            )
          )

          expect(await finicityApi.ResolveUserId('testUserId')).toEqual(
            'createdFinicityUserId'
          )
        })
      })
    })
  })
})
