import { http, HttpResponse } from 'msw'
import config from '../config'
import { get, set } from '../services/storageClient/redis'
import { ChallengeType, ConnectionStatus } from '../shared/contract'
import {
  AGGREGATE_MEMBER_PATH,
  ANSWER_CHALLENGE_PATH,
  CREATE_MEMBER_PATH,
  CREATE_USER_PATH,
  DELETE_CONNECTION_PATH,
  DELETE_MEMBER_PATH,
  EXTEND_HISTORY_PATH,
  MX_DELETE_USER_PATH,
  MX_INSTITUTION_BY_ID_PATH,
  READ_MEMBER_STATUS_PATH,
  UPDATE_CONNECTION_PATH,
  VERIFY_MEMBER_PATH
} from '../test/handlers'
import { institutionData } from '../test/testData/institution'
import { institutionCredentialsData } from '../test/testData/institutionCredentials'
import {
  aggregateMemberMemberData,
  connectionByIdMemberData,
  extendHistoryMemberData,
  identifyMemberData,
  memberData,
  membersData,
  memberStatusData,
  verifyMemberData
} from '../test/testData/members'
import { createUserData, listUsersData } from '../test/testData/users'
import { server } from '../test/testServer'
import { EXTENDED_HISTORY_NOT_SUPPORTED_MSG, MxAdapter } from './mx'

const mxAdapterInt = new MxAdapter(true)

const mxAdapter = new MxAdapter(false)

const institutionResponse = institutionData.institution

const clientRedirectUrl = `${config.HostUrl}/oauth_redirect`

const testCredential = {
  id: 'testCredentialId',
  label: 'testCredentialLabel',
  value: 'testCredentialValue',
  field_type: 'testCredentialFieldType',
  field_name: 'testCredentialFieldName'
}

const testChallenge = {
  id: 'testChallengeId',
  external_id: 'testExternalId',
  question: 'testQuestion',
  data: 'testData',
  type: ChallengeType.QUESTION,
  response: 'testResponse'
}

describe('mx provider', () => {
  describe('MxAdapter', () => {
    it('works with integration credentials', async () => {
      expect(await mxAdapterInt.GetInstitutionById('testId')).toEqual({
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
        expect(await mxAdapter.GetInstitutionById('testId')).toEqual({
          id: institutionResponse.code,
          logo_url: institutionResponse.medium_logo_url,
          name: institutionResponse.name,
          oauth: institutionResponse.supports_oauth,
          url: institutionResponse.url,
          provider: 'mx'
        })
      })

      it('uses the small logo if no medium logo', async () => {
        server.use(
          http.get(MX_INSTITUTION_BY_ID_PATH, () =>
            HttpResponse.json({
              ...institutionData,
              institution: {
                ...institutionData.institution,
                medium_logo_url: undefined
              }
            })
          )
        )

        expect(await mxAdapter.GetInstitutionById('testId')).toEqual({
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
      const [firstCredential, secondCredential] =
        institutionCredentialsData.credentials

      it('transforms the credentials into useable form', async () => {
        expect(await mxAdapter.ListInstitutionCredentials('testId')).toEqual([
          {
            id: firstCredential.guid,
            field_name: firstCredential.field_name,
            field_type: firstCredential.field_type,
            label: firstCredential.field_name
          },
          {
            id: secondCredential.guid,
            field_name: secondCredential.field_name,
            field_type: secondCredential.field_type,
            label: secondCredential.field_name
          }
        ])
      })
    })

    describe('ListConnections', () => {
      const [firstMember, secondMember] = membersData.members

      it('retrieves and transforms the members', async () => {
        expect(await mxAdapter.ListConnections('testId')).toEqual([
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
      const [firstCredential, secondCredential] =
        institutionCredentialsData.credentials

      it('retreieves and transforms member credentials', async () => {
        expect(
          await mxAdapter.ListConnectionCredentials(
            'testMemberId',
            'testUserId'
          )
        ).toEqual([
          {
            id: firstCredential.guid,
            field_name: firstCredential.field_name,
            field_type: firstCredential.field_type,
            label: firstCredential.field_name
          },
          {
            id: secondCredential.guid,
            field_name: secondCredential.field_name,
            field_type: secondCredential.field_type,
            label: secondCredential.field_name
          }
        ])
      })
    })

    describe('CreateConnection', () => {
      const baseConnectionRequest = {
        id: 'testId',
        initial_job_type: 'verification',
        background_aggregation_is_disabled: false,
        credentials: [testCredential],
        institution_id: 'testInstitutionId',
        is_oauth: false,
        skip_aggregation: false,
        metadata: 'testMetadata'
      }

      it('deletes the existing member if one is found', async () => {
        let memberDeletionAttempted = false

        server.use(
          http.delete(DELETE_MEMBER_PATH, () => {
            memberDeletionAttempted = true

            return new HttpResponse(null, {
              status: 200
            })
          })
        )

        await mxAdapter.CreateConnection(
          {
            ...baseConnectionRequest,
            institution_id: membersData.members[0].institution_code,
            is_oauth: true
          },
          'testUserId'
        )

        expect(memberDeletionAttempted).toBe(true)
      })

      describe('createMemberPayload spy tests', () => {
        let createMemberPayload: any

        beforeEach(() => {
          createMemberPayload = null

          server.use(
            http.post(CREATE_MEMBER_PATH, async ({ request }) => {
              createMemberPayload = await request.json()

              return HttpResponse.json(memberData)
            })
          )
        })

        it('creates member with a client_redirect_url if is_oauth', async () => {
          await mxAdapter.CreateConnection(
            {
              ...baseConnectionRequest,
              is_oauth: true
            },
            'testUserId'
          )

          expect(createMemberPayload.client_redirect_url).toEqual(
            clientRedirectUrl
          )
        })

        it('creates member without a client_redirect_url if !is_oauth', async () => {
          await mxAdapter.CreateConnection(
            {
              ...baseConnectionRequest,
              is_oauth: false
            },
            'testUserId'
          )

          expect(createMemberPayload.client_redirect_url).toEqual(null)
        })

        it('creates a member with skip_aggregation if requested', async () => {
          await mxAdapter.CreateConnection(
            {
              ...baseConnectionRequest,
              skip_aggregation: true
            },
            'testUserId'
          )

          expect(createMemberPayload.member.skip_aggregation).toEqual(true)
        })

        it('creates a member with skip_aggregation if jobType is not aggregate', async () => {
          await mxAdapter.CreateConnection(
            {
              ...baseConnectionRequest,
              initial_job_type: 'auth'
            },
            'testUserId'
          )

          expect(createMemberPayload.member.skip_aggregation).toEqual(true)
        })

        it('creates a member with !skip_aggregation if jobType is aggregate', async () => {
          await mxAdapter.CreateConnection(
            {
              ...baseConnectionRequest,
              initial_job_type: 'aggregate'
            },
            'testUserId'
          )

          expect(createMemberPayload.member.skip_aggregation).toEqual(false)
        })

        it('creates a member with correctly mapped request options and returns the member from that response when is_oauth', async () => {
          await mxAdapter.CreateConnection(
            {
              ...baseConnectionRequest,
              is_oauth: true
            },
            'testUserId'
          )

          expect(createMemberPayload).toEqual({
            client_redirect_url: clientRedirectUrl,
            member: {
              credentials: [
                {
                  guid: baseConnectionRequest.credentials[0].id,
                  value: baseConnectionRequest.credentials[0].value
                }
              ],
              institution_code: baseConnectionRequest.institution_id,
              is_oauth: true,
              skip_aggregation: true
            },
            referral_source: 'APP'
          })
        })
      })

      it('returns the member from verifyMember if job type is verification or aggregate_identity_verification', async () => {
        const verificationMember = await mxAdapter.CreateConnection(
          {
            ...baseConnectionRequest,
            initial_job_type: 'verification'
          },
          'testUserId'
        )

        expect(verificationMember.id).toEqual(verifyMemberData.member.guid)

        const aggregateMember = await mxAdapter.CreateConnection(
          {
            ...baseConnectionRequest,
            initial_job_type: 'aggregate_identity_verification'
          },
          'testUserId'
        )

        expect(aggregateMember.id).toEqual(verifyMemberData.member.guid)
      })

      it('returns the member from identifyMember if job type is aggregate_identity', async () => {
        const member = await mxAdapter.CreateConnection(
          {
            ...baseConnectionRequest,
            initial_job_type: 'aggregate_identity'
          },
          'testUserId'
        )

        expect(member.id).toEqual(identifyMemberData.member.guid)
      })

      it('returns the member from extendHistory if job type is aggregate_extendedhistory', async () => {
        const member = await mxAdapter.CreateConnection(
          {
            ...baseConnectionRequest,
            initial_job_type: 'aggregate_extendedhistory'
          },
          'testUserId'
        )

        expect(member.id).toEqual(extendHistoryMemberData.member.guid)
      })
    })

    describe('DeleteConnection', () => {
      it('deletes the connection', async () => {
        let connectionDeletionAttempted = false

        server.use(
          http.delete(DELETE_CONNECTION_PATH, () => {
            connectionDeletionAttempted = true

            return new HttpResponse(null, {
              status: 200
            })
          })
        )

        await mxAdapter.DeleteConnection('testId', 'testUserId')

        expect(connectionDeletionAttempted).toBe(true)
      })
    })

    describe('DeleteUser', () => {
      it('deletes the user', async () => {
        let userDeletionAttempted = false

        server.use(
          http.delete(MX_DELETE_USER_PATH, () => {
            userDeletionAttempted = true

            return new HttpResponse(null, {
              status: 204
            })
          })
        )

        await mxAdapter.DeleteUser('testUserId')

        expect(userDeletionAttempted).toBe(true)
      })
    })

    describe('UpdateConnection', () => {
      const baseUpdateConnectionRequest = {
        id: 'testUpdateConnectionId',
        job_type: 'auth',
        credentials: [testCredential],
        challenges: [testChallenge]
      }

      it('returns the member from verifyMember if jobType is verification', async () => {
        const member = await mxAdapter.UpdateConnection(
          {
            ...baseUpdateConnectionRequest,
            job_type: 'verification'
          },
          'testUserId'
        )

        expect(member.id).toEqual(verifyMemberData.member.guid)
      })

      it('returns the member from identifyMember if jobType is aggregate_identity', async () => {
        const member = await mxAdapter.UpdateConnection(
          {
            ...baseUpdateConnectionRequest,
            job_type: 'aggregate_identity'
          },
          'testUserId'
        )

        expect(member.id).toEqual(identifyMemberData.member.guid)
      })

      it('returns the member from extendHistory if jobType is aggregate_extendedhistory', async () => {
        const member = await mxAdapter.UpdateConnection(
          {
            ...baseUpdateConnectionRequest,
            job_type: 'aggregate_extendedhistory'
          },
          'testUserId'
        )

        expect(member.id).toEqual(extendHistoryMemberData.member.guid)
      })

      it('returns the member from aggregateMember if jobType is agg', async () => {
        const member = await mxAdapter.UpdateConnection(
          {
            ...baseUpdateConnectionRequest,
            job_type: 'agg'
          },
          'testUserId'
        )

        expect(member.id).toEqual(aggregateMemberMemberData.member.guid)
      })

      it('returns the member from aggregateMember if extended history is not supported', async () => {
        server.use(
          http.post(EXTEND_HISTORY_PATH, () =>
            HttpResponse.json({
              error: {
                message: EXTENDED_HISTORY_NOT_SUPPORTED_MSG
              }
            })
          )
        )

        const member = await mxAdapter.UpdateConnection(
          {
            ...baseUpdateConnectionRequest,
            job_type: 'aggregate_extendedhistory'
          },
          'testUserId'
        )

        expect(member.id).toEqual(aggregateMemberMemberData.member.guid)
      })

      it('returns an error message if a request fails', async () => {
        const errorMessage = 'testError'

        server.use(
          http.post(VERIFY_MEMBER_PATH, () =>
            HttpResponse.json({
              error: {
                message: errorMessage
              }
            })
          )
        )

        const error = await mxAdapter.UpdateConnection(
          {
            ...baseUpdateConnectionRequest,
            job_type: 'verification'
          },
          'testUserId'
        )

        expect(error).toEqual({
          error_message: errorMessage,
          id: baseUpdateConnectionRequest.id
        })
      })

      it('returns an error message if the aggregate member request fails after extended history is not supported', async () => {
        server.use(
          http.post(EXTEND_HISTORY_PATH, () =>
            HttpResponse.json({
              error: {
                message: EXTENDED_HISTORY_NOT_SUPPORTED_MSG
              }
            })
          )
        )

        const errorMessage = 'testError'

        server.use(
          http.post(AGGREGATE_MEMBER_PATH, () =>
            HttpResponse.json({
              error: {
                message: errorMessage
              }
            })
          )
        )

        const error = await mxAdapter.UpdateConnection(
          {
            ...baseUpdateConnectionRequest,
            job_type: 'aggregate_extendedhistory'
          },
          'testUserId'
        )

        expect(error).toEqual({
          error_message: errorMessage,
          id: baseUpdateConnectionRequest.id
        })
      })
    })

    describe('UpdateConnectionInternal', () => {
      it('it calls updateMember with the correct request body and returns the member', async () => {
        let updateConnectionPaylod

        server.use(
          http.put(UPDATE_CONNECTION_PATH, async ({ request }) => {
            updateConnectionPaylod = await request.json()

            return HttpResponse.json(memberData)
          })
        )

        const member = await mxAdapter.UpdateConnectionInternal(
          {
            id: 'updateConnectionId',
            job_type: 'testJobType',
            credentials: [testCredential],
            challenges: [testChallenge]
          },
          'testUserId'
        )

        expect(updateConnectionPaylod).toEqual({
          member: {
            credentials: [
              {
                guid: testCredential.id,
                value: testCredential.value
              }
            ]
          }
        })

        const testMember = memberData.member

        expect(member).toEqual({
          cur_job_id: testMember.guid,
          id: testMember.guid,
          institution_code: testMember.institution_code,
          is_being_aggregated: testMember.is_being_aggregated,
          is_oauth: testMember.is_oauth,
          oauth_window_uri: testMember.oauth_window_uri,
          provider: 'mx'
        })
      })
    })

    describe('GetConnectionById', () => {
      it('returns the member from readMember', async () => {
        const testUserId = 'userId'
        const member = await mxAdapter.GetConnectionById(
          'connectionId',
          testUserId
        )

        const testMember = connectionByIdMemberData.member

        expect(member).toEqual({
          id: testMember.guid,
          institution_code: testMember.institution_code,
          is_being_aggregated: testMember.is_being_aggregated,
          is_oauth: testMember.is_oauth,
          oauth_window_uri: testMember.oauth_window_uri,
          provider: 'mx',
          user_id: testUserId
        })
      })
    })

    describe('GetConnectionStatus', () => {
      it("returns a rejected connection status if there's an error with oauthStatus", async () => {
        await set(memberStatusData.member.guid, { error: true })

        const connectionStatus = await mxAdapter.GetConnectionStatus(
          'testMemberId',
          'testJobId',
          false,
          'testUserId'
        )

        expect(connectionStatus.status).toEqual(ConnectionStatus.REJECTED)
      })

      it('returns a properly mapped response with TEXT, OPTIONS< TOKEN< IMAGE_DATA, and IMAGE_OPTIONS challenges', async () => {
        const challenges = [
          {
            guid: 'challengeGuid1',
            label: 'challengeLabel1',
            type: 'TEXT'
          },
          {
            guid: 'challengeGuid2',
            label: 'challengeLabel2',
            options: [
              {
                label: 'optionLabel1',
                value: 'optionValue1'
              }
            ],
            type: 'OPTIONS'
          },
          {
            guid: 'challengeGuid3',
            label: 'challengeLabel3',
            type: 'TOKEN'
          },
          {
            guid: 'challengeGuid4',
            label: 'challengeLabel4',
            image_data: 'imageData',
            type: 'IMAGE_DATA'
          },
          {
            guid: 'challengeGuid5',
            image_options: [
              {
                label: 'optionLabel1',
                value: 'optionValue1'
              }
            ],
            label: 'challengeLabel5',
            type: 'IMAGE_OPTIONS'
          }
        ]

        const [
          textChallenge,
          optionsChallenge,
          tokenChallenge,
          imageChallenge,
          imageOptionsChallenge
        ] = challenges

        server.use(
          http.get(READ_MEMBER_STATUS_PATH, () =>
            HttpResponse.json({
              ...memberStatusData,
              member: {
                ...memberStatusData.member,
                challenges
              }
            })
          )
        )

        const testMember = memberStatusData.member
        const userId = 'testUserId'

        expect(
          await mxAdapter.GetConnectionStatus(
            'testMemberId',
            'testJobId',
            false,
            userId
          )
        ).toEqual({
          cur_job_id: testMember.guid,
          provider: 'mx',
          id: testMember.guid,
          user_id: userId,
          status:
            ConnectionStatus[
              testMember.connection_status as keyof typeof ConnectionStatus
            ],
          challenges: [
            {
              data: [
                {
                  key: '0',
                  value: textChallenge.label
                }
              ],
              id: textChallenge.guid,
              type: ChallengeType.QUESTION,
              question: textChallenge.label
            },
            {
              data: [
                {
                  key: optionsChallenge.options[0].label,
                  value: optionsChallenge.options[0].value
                }
              ],
              id: optionsChallenge.guid,
              question: optionsChallenge.label,
              type: ChallengeType.OPTIONS
            },
            {
              id: tokenChallenge.guid,
              data: tokenChallenge.label,
              question: tokenChallenge.label,
              type: ChallengeType.TOKEN
            },
            {
              data: imageChallenge.image_data,
              id: imageChallenge.guid,
              question: imageChallenge.label,
              type: ChallengeType.IMAGE
            },
            {
              data: [
                {
                  key: imageOptionsChallenge.image_options[0].label,
                  value: imageOptionsChallenge.image_options[0].value
                }
              ],
              id: imageOptionsChallenge.guid,
              question: imageOptionsChallenge.label,
              type: ChallengeType.IMAGE_OPTIONS
            }
          ]
        })
      })
    })

    describe('AnswerChallenge', () => {
      it('calls the resumeAggregation endpoint with the correct payload and returns true', async () => {
        let answerChallengePayload

        server.use(
          http.put(ANSWER_CHALLENGE_PATH, async ({ request }) => {
            answerChallengePayload = await request.json()

            return new HttpResponse(null, { status: 200 })
          })
        )

        const challenge = {
          id: 'challengeId',
          response: 'challengeResponse'
        }

        expect(
          await mxAdapter.AnswerChallenge(
            {
              id: 'requestId',
              job_type: 'auth',
              credentials: [],
              challenges: [challenge]
            },
            'jobId',
            'userId'
          )
        )

        expect(answerChallengePayload).toEqual({
          member: {
            challenges: [
              {
                guid: challenge.id,
                value: challenge.response
              }
            ]
          }
        })
      })
    })

    describe('ResolveUserId', () => {
      it("returns the mx user from listUsers if it's available", async () => {
        const user = listUsersData.users[0]

        const returnedUserId = await mxAdapter.ResolveUserId(user.id)

        expect(returnedUserId).toEqual(user.guid)
      })

      it("creates the user if the user isn't in the list and returns it from there", async () => {
        const returnedUserId = await mxAdapter.ResolveUserId(
          'userIdNotInListUsers'
        )

        expect(returnedUserId).toEqual(createUserData.user.guid)
      })

      it('returns the provided userId if creating a user fails', async () => {
        server.use(
          http.post(
            CREATE_USER_PATH,
            () => new HttpResponse(null, { status: 400 })
          )
        )

        const userId = 'userIdNotInListUsers'

        const returnedUserId = await mxAdapter.ResolveUserId(userId)

        expect(returnedUserId).toEqual(userId)
      })

      it('throws an error if customer does not exist and failIfNotFound is true', async () => {
        const userId = 'userIdNotInListUsers'

        await expect(
          async () => await mxAdapter.ResolveUserId(userId, true)
        ).rejects.toThrow('User not resolved successfully')
      })
    })

    describe('HandleOauthResponse', () => {
      const errorReason = 'errorReason'
      const memberGuid = 'memberGuid'

      it('sets an error in redis if status is error', async () => {
        const response = await MxAdapter.HandleOauthResponse({
          member_guid: memberGuid,
          status: 'error',
          error_reason: errorReason
        })

        expect(await get(memberGuid)).toEqual({
          error: true,
          error_reason: errorReason
        })

        expect(response).toMatchObject({
          id: memberGuid,
          error: errorReason,
          status: ConnectionStatus.REJECTED
        })
      })

      it('returns with connected status if success', async () => {
        const response = await MxAdapter.HandleOauthResponse({
          member_guid: memberGuid,
          status: 'success',
          error_reason: errorReason
        })

        expect(response.status).toEqual(ConnectionStatus.CONNECTED)
      })

      it('returns with pending status if not success', async () => {
        const response = await MxAdapter.HandleOauthResponse({
          member_guid: memberGuid,
          status: 'notSuccessOrError',
          error_reason: errorReason
        })

        expect(response.status).toEqual(ConnectionStatus.PENDING)
      })
    })
  })
})
