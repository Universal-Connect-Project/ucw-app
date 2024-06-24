import { server } from '../test/testServer'
import config from '../config'
import { SophtronAdapter } from './sophtron'
import { HttpResponse, http } from 'msw'
import { SOPHTRON_DELETE_MEMBER_PATH } from '../test/handlers'
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
})
