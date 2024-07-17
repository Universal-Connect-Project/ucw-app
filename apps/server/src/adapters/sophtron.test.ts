import { HttpResponse, http } from 'msw'
import type {
  CreateConnectionRequest,
  UpdateConnectionRequest
} from '../shared/contract'
import { ChallengeType, ConnectionStatus } from '../shared/contract'
import {
  SOPHTRON_ANSWER_JOB_MFA_PATH,
  SOPHTRON_CREATE_CUSTOMER_PATH,
  SOPHTRON_CREATE_MEMBER_PATH,
  SOPHTRON_CUSTOMER_UNIQUE_ID_PATH,
  SOPHTRON_DELETE_MEMBER_PATH,
  SOPHTRON_DELETE_USER_PATH,
  SOPHTRON_GET_JOB_INFO_PATH,
  SOPHTRON_INSTITUTION_BY_ID_PATH,
  SOPHTRON_MEMBER_BY_ID_PATH,
  SOPHTRON_UPDATE_MEMBER_PATH
} from '../test/handlers'
import {
  sophtronInstitutionData,
  sophtronUserInstitutionAccountsData
} from '../test/testData/institution'
import {
  createCustomerData,
  customerFromUniqueIdData
} from '../test/testData/sophtronCustomer'
import {
  createMemberData,
  getMemberData,
  updateMemberData
} from '../test/testData/sophtronMember'
import { server } from '../test/testServer'
import { SophtronAdapter } from './sophtron'

const adapter = new SophtronAdapter()

const testId = 'testId'
const testUserId = 'testUserId'
const testJobId = 'testJobId'
const testUserInstitutionId = 'testUserInstitutionId'
const usernameValue = 'testUsernameValue'
const passwordValue = 'passwordValue'
const accountsReadyStatus = 'AccountsReady'

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

  describe('DeleteUser', () => {
    it('calls the delete user endpoint', async () => {
      let deleteUserAttempted = false
      let requestParams

      server.use(
        http.delete(SOPHTRON_DELETE_USER_PATH, ({ params }) => {
          deleteUserAttempted = true
          requestParams = params

          return new HttpResponse(null, { status: 200 })
        })
      )

      await adapter.DeleteUser(testUserId)

      expect(deleteUserAttempted).toBe(true)
      expect(requestParams).toEqual({
        userId: testUserId
      })
    })
  })

  describe('UpdateConnection', () => {
    it('calls the updateMember endpoint with the correct payload and returns a response', async () => {
      let updateMemberPayload

      server.use(
        http.put(SOPHTRON_UPDATE_MEMBER_PATH, async ({ request }) => {
          updateMemberPayload = await request.json()

          return HttpResponse.json(updateMemberData)
        })
      )

      const response = await adapter.UpdateConnection(
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
          id: testId
        } as UpdateConnectionRequest,
        testUserId
      )

      expect(updateMemberPayload).toEqual({
        Password: passwordValue,
        UserName: usernameValue
      })

      expect(response).toEqual({
        cur_job_id: updateMemberData.JobID,
        id: updateMemberData.MemberID,
        institution_code: 'institution_code',
        provider: 'sophtron'
      })
    })
  })

  describe('GetConnectionById', () => {
    it('calls the getMember endpoint with the correct parameters and returns the connection', async () => {
      let getMemberParams

      server.use(
        http.get(SOPHTRON_MEMBER_BY_ID_PATH, ({ params }) => {
          getMemberParams = params

          return HttpResponse.json(getMemberData)
        })
      )

      const response = await adapter.GetConnectionById(testId, testUserId)

      expect(response).toEqual({
        id: getMemberData.MemberID,
        institution_code: getMemberData.InstitutionID,
        provider: 'sophtron',
        user_id: testUserId
      })

      expect(getMemberParams).toEqual({
        memberId: testId,
        userId: testUserId
      })
    })
  })

  describe('GetConnectionStatus', () => {
    it('returns the connection using the memberId and userId if there is no jobId', async () => {
      const response = await adapter.GetConnectionStatus(
        testId,
        undefined,
        false,
        testUserId
      )

      expect(response).toEqual({
        id: getMemberData.MemberID,
        institution_code: getMemberData.InstitutionID,
        provider: 'sophtron',
        user_id: testUserId
      })
    })

    it('handles the job status success case', async () => {
      server.use(
        http.get(SOPHTRON_GET_JOB_INFO_PATH, () =>
          HttpResponse.json({
            JobID: testJobId,
            SuccessFlag: true,
            UserInstitutionID: testUserInstitutionId
          })
        )
      )

      const response = await adapter.GetConnectionStatus(
        testId,
        testJobId,
        false,
        testUserId
      )

      expect(response).toEqual({
        id: testUserInstitutionId,
        user_id: testUserId,
        cur_job_id: testJobId,
        status: ConnectionStatus.CONNECTED,
        provider: 'sophtron'
      })
    })

    it('handles the job status failure case', async () => {
      server.use(
        http.get(SOPHTRON_GET_JOB_INFO_PATH, () =>
          HttpResponse.json({
            JobID: testJobId,
            SuccessFlag: false,
            UserInstitutionID: testUserInstitutionId
          })
        )
      )

      const response = await adapter.GetConnectionStatus(
        testId,
        testJobId,
        false,
        testUserId
      )

      expect(response).toEqual({
        id: testUserInstitutionId,
        user_id: testUserId,
        cur_job_id: testJobId,
        status: ConnectionStatus.FAILED,
        provider: 'sophtron'
      })
    })

    it('handles the job status AccountsReady case', async () => {
      server.use(
        http.get(SOPHTRON_GET_JOB_INFO_PATH, () =>
          HttpResponse.json({
            JobID: testJobId,
            JobType: 'agg',
            LastStatus: accountsReadyStatus,
            UserInstitutionID: testUserInstitutionId
          })
        )
      )

      const response = await adapter.GetConnectionStatus(
        testId,
        testJobId,
        false,
        testUserId
      )

      expect(response).toEqual({
        id: testUserInstitutionId,
        user_id: testUserId,
        cur_job_id: testJobId,
        status: ConnectionStatus.CREATED,
        provider: 'sophtron'
      })
    })

    it('handles the job status AccountsReady case with single account select', async () => {
      server.use(
        http.get(SOPHTRON_GET_JOB_INFO_PATH, () =>
          HttpResponse.json({
            JobID: testJobId,
            JobType: 'refreshauthall',
            LastStatus: accountsReadyStatus,
            UserInstitutionID: testUserInstitutionId
          })
        )
      )

      const response = await adapter.GetConnectionStatus(
        testId,
        testJobId,
        true,
        testUserId
      )

      const [firstAccount] = sophtronUserInstitutionAccountsData

      expect(response).toEqual({
        challenges: [
          {
            id: 'single_account_select',
            external_id: 'single_account_select',
            type: ChallengeType.OPTIONS,
            question: 'Please select an account to proceed:',
            data: [
              {
                key: `${firstAccount.AccountName} ${firstAccount.AccountNumber}`,
                value: firstAccount.AccountID
              }
            ]
          }
        ],
        id: testUserInstitutionId,
        user_id: testUserId,
        cur_job_id: testJobId,
        status: ConnectionStatus.CHALLENGED,
        provider: 'sophtron'
      })
    })

    it('handles the job status SecurityQuestion case', async () => {
      const securityQuestionString = 'securityQuestionString'

      server.use(
        http.get(SOPHTRON_GET_JOB_INFO_PATH, () =>
          HttpResponse.json({
            JobID: testJobId,
            JobType: 'agg',
            SecurityQuestion: JSON.stringify([securityQuestionString]),
            UserInstitutionID: testUserInstitutionId
          })
        )
      )

      const response = await adapter.GetConnectionStatus(
        testId,
        testJobId,
        false,
        testUserId
      )

      expect(response).toEqual({
        challenges: [
          {
            id: 'SecurityQuestion',
            type: ChallengeType.QUESTION,
            data: [
              {
                key: securityQuestionString,
                value: securityQuestionString
              }
            ]
          }
        ],
        id: testUserInstitutionId,
        user_id: testUserId,
        cur_job_id: testJobId,
        status: ConnectionStatus.CHALLENGED,
        provider: 'sophtron'
      })
    })

    it('handles the job status TokenMethod case', async () => {
      const tokenMethodString = 'tokenMethodString'

      server.use(
        http.get(SOPHTRON_GET_JOB_INFO_PATH, () =>
          HttpResponse.json({
            JobID: testJobId,
            JobType: 'agg',
            TokenMethod: JSON.stringify([tokenMethodString]),
            UserInstitutionID: testUserInstitutionId
          })
        )
      )

      const response = await adapter.GetConnectionStatus(
        testId,
        testJobId,
        false,
        testUserId
      )

      expect(response).toEqual({
        challenges: [
          {
            id: 'TokenMethod',
            type: ChallengeType.OPTIONS,
            data: [
              {
                key: tokenMethodString,
                value: tokenMethodString
              }
            ],
            question: 'Please select a channel to receive your secure code'
          }
        ],
        id: testUserInstitutionId,
        user_id: testUserId,
        cur_job_id: testJobId,
        status: ConnectionStatus.CHALLENGED,
        provider: 'sophtron'
      })
    })

    it('handles the job status TokenSent case', async () => {
      const testTokenInputName = 'testTokenInputName'

      server.use(
        http.get(SOPHTRON_GET_JOB_INFO_PATH, () =>
          HttpResponse.json({
            JobID: testJobId,
            JobType: 'agg',
            TokenInputName: testTokenInputName,
            TokenSentFlag: true,
            UserInstitutionID: testUserInstitutionId
          })
        )
      )

      const response = await adapter.GetConnectionStatus(
        testId,
        testJobId,
        false,
        testUserId
      )

      expect(response).toEqual({
        challenges: [
          {
            id: 'TokenSentFlag',
            type: ChallengeType.QUESTION,
            data: [
              {
                key: 'ota',
                value: `Please enter the ${testTokenInputName}`
              }
            ],
            question: 'ota'
          }
        ],
        id: testUserInstitutionId,
        user_id: testUserId,
        cur_job_id: testJobId,
        status: ConnectionStatus.CHALLENGED,
        provider: 'sophtron'
      })
    })

    it('handles the job status TokenSent case without a tokenInputName', async () => {
      server.use(
        http.get(SOPHTRON_GET_JOB_INFO_PATH, () =>
          HttpResponse.json({
            JobID: testJobId,
            JobType: 'agg',
            TokenSentFlag: true,
            UserInstitutionID: testUserInstitutionId
          })
        )
      )

      const response = await adapter.GetConnectionStatus(
        testId,
        testJobId,
        false,
        testUserId
      )

      expect(response).toEqual({
        challenges: [
          {
            id: 'TokenSentFlag',
            type: ChallengeType.QUESTION,
            data: [
              {
                key: 'ota',
                value: 'Please enter the OTA code'
              }
            ],
            question: 'ota'
          }
        ],
        id: testUserInstitutionId,
        user_id: testUserId,
        cur_job_id: testJobId,
        status: ConnectionStatus.CHALLENGED,
        provider: 'sophtron'
      })
    })

    it('handles the job status TokenRead case', async () => {
      const testTokenRead = 'testTokenRead'

      server.use(
        http.get(SOPHTRON_GET_JOB_INFO_PATH, () =>
          HttpResponse.json({
            JobID: testJobId,
            JobType: 'agg',
            TokenRead: testTokenRead,
            UserInstitutionID: testUserInstitutionId
          })
        )
      )

      const response = await adapter.GetConnectionStatus(
        testId,
        testJobId,
        false,
        testUserId
      )

      expect(response).toEqual({
        challenges: [
          {
            id: 'TokenRead',
            type: ChallengeType.TOKEN,
            data: testTokenRead,
            question: `Please approve from your secure device with the following token: ${testTokenRead}`
          }
        ],
        id: testUserInstitutionId,
        user_id: testUserId,
        cur_job_id: testJobId,
        status: ConnectionStatus.CHALLENGED,
        provider: 'sophtron'
      })
    })

    it('handles the job status CaptchaImage case', async () => {
      const testCaptchaImage = 'testCaptchaImage'

      server.use(
        http.get(SOPHTRON_GET_JOB_INFO_PATH, () =>
          HttpResponse.json({
            JobID: testJobId,
            JobType: 'agg',
            CaptchaImage: testCaptchaImage,
            UserInstitutionID: testUserInstitutionId
          })
        )
      )

      const response = await adapter.GetConnectionStatus(
        testId,
        testJobId,
        false,
        testUserId
      )

      expect(response).toEqual({
        challenges: [
          {
            id: 'CaptchaImage',
            type: ChallengeType.IMAGE,
            data: testCaptchaImage,
            question: 'Please enter the Captcha code'
          }
        ],
        id: testUserInstitutionId,
        user_id: testUserId,
        cur_job_id: testJobId,
        status: ConnectionStatus.CHALLENGED,
        provider: 'sophtron'
      })
    })
  })

  it('defaults to connection status created', async () => {
    server.use(
      http.get(SOPHTRON_GET_JOB_INFO_PATH, () =>
        HttpResponse.json({
          JobID: testJobId,
          JobType: 'agg',
          UserInstitutionID: testUserInstitutionId
        })
      )
    )

    const response = await adapter.GetConnectionStatus(
      testId,
      testJobId,
      false,
      testUserId
    )

    expect(response).toEqual({
      id: testUserInstitutionId,
      user_id: testUserId,
      cur_job_id: testJobId,
      status: ConnectionStatus.CREATED,
      provider: 'sophtron'
    })
  })

  describe('AnswerChallenge', () => {
    it('calls the answerJobMfa api with true for TokenRead', async () => {
      let requestParams
      let requestBody

      server.use(
        http.put(SOPHTRON_ANSWER_JOB_MFA_PATH, async ({ params, request }) => {
          requestParams = params
          requestBody = await request.json()

          return new HttpResponse(null, { status: 200 })
        })
      )

      const response = await adapter.AnswerChallenge(
        {
          challenges: [
            {
              id: 'TokenRead'
            }
          ]
        } as UpdateConnectionRequest,
        testId
      )

      expect(requestBody).toEqual({
        AnswerText: true
      })
      expect(requestParams).toEqual({
        challengeId: 'TokenRead',
        jobId: testId
      })

      expect(response).toBe(true)
    })

    it('calls the answerJobMfa api with a stringified response for SecurityQuestion', async () => {
      let requestParams
      let requestBody

      server.use(
        http.put(SOPHTRON_ANSWER_JOB_MFA_PATH, async ({ params, request }) => {
          requestParams = params
          requestBody = await request.json()

          return new HttpResponse(null, { status: 200 })
        })
      )

      const testQuestionResponse = 'testQuestionResponse'

      const response = await adapter.AnswerChallenge(
        {
          challenges: [
            {
              id: 'SecurityQuestion',
              response: testQuestionResponse
            }
          ]
        } as UpdateConnectionRequest,
        testId
      )

      expect(requestBody).toEqual({
        AnswerText: JSON.stringify([testQuestionResponse])
      })
      expect(requestParams).toEqual({
        challengeId: 'SecurityQuestion',
        jobId: testId
      })

      expect(response).toBe(true)
    })

    it('calls the answerJobMfa api with the response for TokenSentFlag', async () => {
      let requestParams
      let requestBody

      server.use(
        http.put(SOPHTRON_ANSWER_JOB_MFA_PATH, async ({ params, request }) => {
          requestParams = params
          requestBody = await request.json()

          return new HttpResponse(null, { status: 200 })
        })
      )

      const testQuestionResponse = 'testQuestionResponse'

      const response = await adapter.AnswerChallenge(
        {
          challenges: [
            {
              id: 'TokenSentFlag',
              response: testQuestionResponse
            }
          ]
        } as UpdateConnectionRequest,
        testId
      )

      expect(requestBody).toEqual({
        AnswerText: testQuestionResponse
      })
      expect(requestParams).toEqual({
        challengeId: 'TokenSentFlag',
        jobId: testId
      })

      expect(response).toBe(true)
    })

    it("returns false if the id doesn't match anything", async () => {
      const response = await adapter.AnswerChallenge(
        {
          challenges: [
            {
              id: 'junk'
            }
          ]
        } as UpdateConnectionRequest,
        testId
      )

      expect(response).toBe(false)
    })
  })

  describe('ResolveUserId', () => {
    it('returns the customerId from getCustomerByUniqueName endpoint if it exists', async () => {
      const response = await adapter.ResolveUserId(testUserId)

      expect(response).toEqual(customerFromUniqueIdData.CustomerID)
    })

    it("creates a new customer and returns its id if there isn't one already", async () => {
      server.use(
        http.get(
          SOPHTRON_CUSTOMER_UNIQUE_ID_PATH,
          () => new HttpResponse(null, { status: 200 })
        )
      )

      const response = await adapter.ResolveUserId(testUserId)

      expect(response).toEqual(createCustomerData.CustomerID)
    })

    it('returns the provided user_id if creation fails', async () => {
      server.use(
        http.get(
          SOPHTRON_CUSTOMER_UNIQUE_ID_PATH,
          () => new HttpResponse(null, { status: 200 })
        )
      )

      server.use(
        http.post(
          SOPHTRON_CREATE_CUSTOMER_PATH,
          () => new HttpResponse(null, { status: 200 })
        )
      )

      const response = await adapter.ResolveUserId(testUserId)

      expect(response).toEqual(testUserId)
    })

    it('throws an error if customer does not exist and failIfNotFound is true', async () => {
      server.use(
        http.get(
          SOPHTRON_CUSTOMER_UNIQUE_ID_PATH,
          () => new HttpResponse(null, { status: 200 })
        )
      )

      const userId = 'userIdNotInListUsers'

      await expect(
        async () => await adapter.ResolveUserId(userId, true)
      ).rejects.toThrow('User not resolved successfully')
    })
  })
})
