import { server } from '../test/testServer'
import config from '../config'
import { SophtronAdapter } from './sophtron'
import { HttpResponse, http } from 'msw'
import {
  SOPHTRON_CREATE_MEMBER_PATH,
  SOPHTRON_DELETE_MEMBER_PATH,
  SOPHTRON_INSTITUTION_BY_ID_PATH,
  SOPHTRON_MEMBER_BY_ID_PATH
} from '../test/handlers'
import { sophtronInstitutionData } from '../test/testData/institution'
import { ConnectionStatus, CreateConnectionRequest } from '../shared/contract'
import { createMemberData } from '../test/testData/sophtronMember'

const adapter = new SophtronAdapter({
  sophtron: {
    clientId: 'testClientId',
    endpoint: config.SophtronApiServiceEndpoint,
    secret: 'testSecret'
  }
})

const testId = 'testId'
const testUserId = 'testUserId'

describe('sophtron adapter', () => {
  describe('GetInstitutionById', () => {
    it('returns a modified institution object', async () => {
      const response = await adapter.GetInstitutionById(testId)

      expect(response).toEqual({
        id: sophtronInstitutionData.InstitutionID,
        logo_url: sophtronInstitutionData.Logo,
        name: sophtronInstitutionData.InstitutionName,
        provider: 'sophtron',
        url: sophtronInstitutionData.URL
      })
    })
  })

  describe('ListInstitutionCredentials', () => {
    it('uses custom login form user name and password if provided', async () => {
      const customName = 'customName'
      const customPassword = 'customPassword'

      server.use(
        http.post(SOPHTRON_INSTITUTION_BY_ID_PATH, () =>
          HttpResponse.json({
            ...sophtronInstitutionData,
            InstitutionDetail: {
              LoginFormUserName: customName,
              LoginFormPassword: customPassword
            }
          })
        )
      )

      const response = await adapter.ListInstitutionCredentials(testId)

      expect(response).toEqual([
        {
          field_name: 'LOGIN',
          field_type: 'LOGIN',
          id: 'username',
          label: 'customName'
        },
        {
          field_name: 'PASSWORD',
          field_type: 'PASSWORD',
          id: 'password',
          label: 'customPassword'
        }
      ])
    })

    it('Uses standard User name and Password if nothing custom is provided', async () => {
      const response = await adapter.ListInstitutionCredentials(testId)

      expect(response).toEqual([
        {
          field_name: 'LOGIN',
          field_type: 'LOGIN',
          id: 'username',
          label: 'User name'
        },
        {
          field_name: 'PASSWORD',
          field_type: 'PASSWORD',
          id: 'password',
          label: 'Password'
        }
      ])
    })
  })

  describe('ListConnectionCredentials', () => {
    it('returns a list of institution credentials if available using the InstitutionId', async () => {
      let institutionId = null

      server.use(
        http.get(SOPHTRON_MEMBER_BY_ID_PATH, ({ params }) => {
          institutionId = params.memberId

          return HttpResponse.json({})
        })
      )

      const response = await adapter.ListConnectionCredentials(
        testId,
        testUserId
      )

      expect(response).toEqual([
        {
          field_name: 'LOGIN',
          field_type: 'LOGIN',
          id: 'username',
          label: 'User name'
        },
        {
          field_name: 'PASSWORD',
          field_type: 'PASSWORD',
          id: 'password',
          label: 'Password'
        }
      ])

      expect(institutionId).toEqual(testId)
    })

    it('returns an empty array if there is no member', async () => {
      server.use(
        http.get(SOPHTRON_MEMBER_BY_ID_PATH, () => HttpResponse.json(undefined))
      )

      const response = await adapter.ListConnectionCredentials(
        testId,
        testUserId
      )

      expect(response).toEqual([])
    })
  })

  describe('ListConnections', () => {
    it('returns an empty array', async () => {
      expect(await adapter.ListConnections()).toEqual([])
    })
  })

  describe('CreateConnection', () => {
    it('does nothing if there is no job type', async () => {
      const response = await adapter.CreateConnection(
        {
          initial_job_type: undefined
        } as CreateConnectionRequest,
        testUserId
      )

      expect(response).toBeUndefined()
    })

    it('uses a None password if there is no password specified', async () => {
      let createMemberPayload: any

      server.use(
        http.post(SOPHTRON_CREATE_MEMBER_PATH, async ({ request }) => {
          createMemberPayload = await request.json()

          return HttpResponse.json(createMemberData)
        })
      )

      await adapter.CreateConnection(
        {
          credentials: [
            {
              id: 'username'
            }
          ],
          initial_job_type: 'agg',
          institution_id: testId
        } as CreateConnectionRequest,
        testUserId
      )

      expect(createMemberPayload.Password).toEqual('None')
    })

    it('calls the create member api with the correct payload and returns the new connection', async () => {
      let createMemberPayload: any

      server.use(
        http.post(SOPHTRON_CREATE_MEMBER_PATH, async ({ request }) => {
          createMemberPayload = await request.json()

          return HttpResponse.json(createMemberData)
        })
      )

      const passwordValue = 'testPasswordValue'
      const usernameValue = 'testUsernameValue'

      const response = await adapter.CreateConnection(
        {
          credentials: [
            {
              id: 'username',
              value: usernameValue
            },
            {
              id: 'password',
              value: passwordValue
            }
          ],
          initial_job_type: 'agg',
          institution_id: testId
        } as CreateConnectionRequest,
        testUserId
      )

      expect(response).toEqual({
        id: 'memberId',
        cur_job_id: 'jobId',
        institution_code: 'testId',
        status: ConnectionStatus.CREATED,
        provider: 'sophtron'
      })

      expect(createMemberPayload).toEqual({
        InstitutionID: testId,
        Password: passwordValue,
        UserName: usernameValue
      })
    })
  })

  describe('DeleteConnection', () => {
    it('calls the delete member endpoint', async () => {
      let deleteMemberAttempted = false
      let requestParams

      server.use(
        http.delete(SOPHTRON_DELETE_MEMBER_PATH, ({ params }) => {
          deleteMemberAttempted = true
          requestParams = params

          return new HttpResponse(null, { status: 200 })
        })
      )

      await adapter.DeleteConnection(testId, testUserId)

      expect(deleteMemberAttempted).toBe(true)
      expect(requestParams).toEqual({
        memberId: testId,
        userId: testUserId
      })
    })
  })
})
