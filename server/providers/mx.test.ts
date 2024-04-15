import { http, HttpResponse } from 'msw'
import { server } from '../../test/testServer'
import { institutionData } from '../../test/testData/institution'
import { MxApi } from './mx'
import { CONNECTIONS_BY_ID_PATH, DELETE_MEMBER_PATH, INSTITUTION_BY_ID_PATH } from '../../test/handlers'
import { institutionCredentialsData } from '../../test/testData/institutionCredentials'
import { membersData } from '../../test/testData/members'

const mxApiInt = new MxApi({
  mxInt: {
    username: 'testUsername',
    password: 'testPassword'
  }
}, true)

const mxApi = new MxApi({
  mxProd: {
    username: 'testUsername',
    password: 'testPassword'
  }
}, false)

const institutionResponse = institutionData.institution

describe('mx provider', () => {
  describe('MxApi', () => {
    it('works with integration credentials', async () => {
      expect(await mxApiInt.GetInstitutionById('testId')).toEqual({
        id: institutionResponse.code,
        logo_url: institutionResponse.medium_logo_url,
        name: institutionResponse.name,
        oauth: institutionResponse.supports_oauth,
        url: institutionResponse.url,
        provider: 'mx_int'
      })
    })

    describe('GetInsitutionById', () => {
      it('uses the medium logo if available', async () => {
        expect(await mxApi.GetInstitutionById('testId')).toEqual({
          id: institutionResponse.code,
          logo_url: institutionResponse.medium_logo_url,
          name: institutionResponse.name,
          oauth: institutionResponse.supports_oauth,
          url: institutionResponse.url,
          provider: 'mx'
        })
      })

      it('uses the small logo if no medium logo', async () => {
        server.use(http.get(INSTITUTION_BY_ID_PATH, () => HttpResponse.json({
          ...institutionData,
          institution: {
            ...institutionData.institution,
            medium_logo_url: undefined
          }
        })
        ))

        expect(await mxApi.GetInstitutionById('testId')).toEqual({
          id: institutionResponse.code,
          logo_url: institutionResponse.small_logo_url,
          name: institutionResponse.name,
          oauth: institutionResponse.supports_oauth,
          url: institutionResponse.url,
          provider: 'mx'
        })
      })
    })

    describe('ListInstitutionCredentials', () => {
      const [firstCredential, secondCredential] = institutionCredentialsData.credentials

      it('transforms the credentials into useable form', async () => {
        expect(await mxApi.ListInstitutionCredentials('testId')).toEqual([{
          id: firstCredential.guid,
          field_name: firstCredential.field_name,
          field_type: firstCredential.field_type,
          label: firstCredential.field_name
        }, {
          id: secondCredential.guid,
          field_name: secondCredential.field_name,
          field_type: secondCredential.field_type,
          label: secondCredential.field_name
        }])
      })
    })

    describe('ListConnections', () => {
      const [firstMember, secondMember] = membersData.members

      it('retrieves and transforms the members', async () => {
        expect(await mxApi.ListConnections('testId')).toEqual([
          {
            id: firstMember.guid,
            cur_job_id: firstMember.guid,
            institution_code: firstMember.institution_code,
            is_being_aggregated: firstMember.is_being_aggregated,
            is_oauth: firstMember.is_oauth,
            oauth_window_uri: firstMember.oauth_window_uri,
            provider: 'mx'
          },
          {
            id: secondMember.guid,
            cur_job_id: secondMember.guid,
            institution_code: secondMember.institution_code,
            is_being_aggregated: secondMember.is_being_aggregated,
            is_oauth: secondMember.is_oauth,
            oauth_window_uri: secondMember.oauth_window_uri,
            provider: 'mx'
          }
        ])
      })
    })

    describe('ListConnectionCredentials', () => {
      const [firstCredential, secondCredential] = institutionCredentialsData.credentials

      it('retreieves and transforms member credentials', async () => {
        expect(await mxApi.ListConnectionCredentials('testMemberId', 'testUserId')).toEqual([{
          id: firstCredential.guid,
          field_name: firstCredential.field_name,
          field_type: firstCredential.field_type,
          label: firstCredential.field_name
        }, {
          id: secondCredential.guid,
          field_name: secondCredential.field_name,
          field_type: secondCredential.field_type,
          label: secondCredential.field_name
        }])
      })
    })

    describe('CreateConnection', () => {
      const baseConnectionRequest = {
        id: 'testId',
        initial_job_type: 'auth',
        background_aggregation_is_disabled: false,
        credentials: [{
          id: 'testCredentialId',
          label: 'testCredentialLabel',
          value: 'testCredentialValue',
          field_type: 'testCredentialFieldType',
          field_name: 'testCredentialFieldName'
        }],
        institution_id: 'testInstitutionId',
        is_oauth: false,
        skip_aggregation: false,
        metadata: 'testMetadata'
      }

      it('deletes the existing member if one is found', async () => {
        server.use(http.get(CONNECTIONS_BY_ID_PATH, () => HttpResponse.json(membersData)))

        let memberDeletionAttempted = false

        server.use(http.delete(DELETE_MEMBER_PATH, () => {
          memberDeletionAttempted = true

          return new HttpResponse(null, {
            status: 200
          })
        }))

        await mxApi.CreateConnection({
          ...baseConnectionRequest,
          institution_id: membersData.members[0].institution_code,
          is_oauth: true
        }, 'testUserId')

        expect(memberDeletionAttempted).toBe(true)
      })

      it('creates member with a client_redirect_url if is_oauth', () => {

      })

      it('creates member without a client_redirect_url if !is_oauth', () => {

      })

      it('creates a member with skip_aggregation if requested', () => {

      })

      it('creates a member with skip_aggregation if jobType is aggregate', () => {

      })

      it('creates a member with !skip_aggregation if jobType is not aggregate', () => {

      })

      it('creates a member with correctly mapped request options and returns the member from that response when is_oauth', () => {

      })

      it('returns the member from verifyMember if job type is verification or aggregate_identity_verification', () => {

      })

      it('returns the member from identifyMember if job type is aggregate_identity', () => {

      })

      it('returns the member from extendHistory if job type is aggregate_extendedhistory', () => {

      })
    })
  })
})
