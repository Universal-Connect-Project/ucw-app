import { server } from '../test/testServer'
import config from '../config'
import { SophtronAdapter } from './sophtron'
import { HttpResponse, http } from 'msw'
import {
  SOPHTRON_DELETE_MEMBER_PATH,
  SOPHTRON_INSTITUTION_BY_ID_PATH
} from '../test/handlers'
import { sophtronInstitutionData } from '../test/testData/institution'

const Adapter = new SophtronAdapter({
  sophtron: {
    clientId: 'testClientId',
    endpoint: config.SophtronApiServiceEndpoint,
    secret: 'testSecret'
  }
})

const testId = 'testId'
const testUserId = 'testUserId'

describe('sophtron adapter', () => {
  describe('clear connection', () => {
    it('calls delete member if there is a vc issues', async () => {
      let memberDeletionAttempted = false

      server.use(
        http.delete(SOPHTRON_DELETE_MEMBER_PATH, () => {
          memberDeletionAttempted = true

          return new HttpResponse(null, {
            status: 200
          })
        })
      )

      await Adapter.clearConnection({ issuer: true }, testId, testUserId)

      expect(memberDeletionAttempted).toBe(true)
    })

    it('doesnt call delete member if there is not a vc issuer', async () => {
      let memberDeletionAttempted = false

      server.use(
        http.delete(SOPHTRON_DELETE_MEMBER_PATH, () => {
          memberDeletionAttempted = true

          return new HttpResponse(null, {
            status: 200
          })
        })
      )

      await Adapter.clearConnection({}, testId, testUserId)

      expect(memberDeletionAttempted).toBe(false)
    })
  })

  describe('GetInstitutionById', () => {
    it('returns a modified institution object', async () => {
      const response = await Adapter.GetInstitutionById(testId)

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

      const response = await Adapter.ListInstitutionCredentials(testId)

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
      const response = await Adapter.ListInstitutionCredentials(testId)

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
})
