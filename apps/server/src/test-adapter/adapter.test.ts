import { ConnectionStatus } from '@repo/utils'
import { TestAdapter } from './adapter'
import { testExampleInstitution } from './constants'
import { MappedJobTypes } from '../shared/contract'

const labelText = 'testLabelText'
const aggregator = 'aggregator'

const testAdapter = new TestAdapter({
  labelText,
  aggregator
})

jest.mock('../services/storageClient/redis')

const successConnectionStatus = {
  aggregator,
  id: 'testId',
  cur_job_id: 'testJobId',
  user_id: 'userId',
  status: ConnectionStatus.CONNECTED,
  challenges: []
} as any

describe('TestAdapter', () => {
  describe('GetInstitutionById', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.GetInstitutionById('test')).toEqual({
        id: 'test',
        logo_url: testExampleInstitution.logo_url,
        name: testExampleInstitution.name,
        oauth: testExampleInstitution.oauth,
        aggregator,
        url: testExampleInstitution.url
      })
    })
  })

  describe('ListInstitutionCredentials', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.ListInstitutionCredentials('test')).toEqual([
        {
          field_name: 'fieldName',
          field_type: 'fieldType',
          id: 'testId',
          label: labelText
        }
      ])
    })
  })

  describe('ListConnections', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.ListConnections('test')).toEqual([
        {
          id: 'testId',
          cur_job_id: 'testJobId',
          institution_code: 'testCode',
          is_being_aggregated: false,
          is_oauth: false,
          oauth_window_uri: undefined,
          aggregator
        }
      ])
    })
  })

  describe('ListConnectionCredentials', () => {
    it('returns a response object', async () => {
      expect(
        await testAdapter.ListConnectionCredentials('test', 'test')
      ).toEqual([
        {
          id: 'testId',
          field_name: 'testFieldName',
          field_type: 'testFieldType',
          label: labelText
        }
      ])
    })
  })

  describe('CreateConnection', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.CreateConnection(undefined, 'test')).toEqual({
        id: 'testId',
        cur_job_id: 'testJobId',
        institution_code: 'testCode',
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        aggregator
      })
    })
  })

  describe('verification flow', () => {
    it('doesnt return a challenge if the job type isnt verification', async () => {
      const userId = 'testUserId'

      const successStatus = {
        ...successConnectionStatus,
        user_id: userId
      }

      await testAdapter.UpdateConnection(
        {
          job_type: MappedJobTypes.AGGREGATE
        } as any,
        userId
      )

      expect(
        await testAdapter.GetConnectionStatus('test', 'test', true, userId)
      ).toEqual(successStatus)
    })

    it('returns success if it hasnt been verified once, returns success if the job type is verification, it has been verified once, and single_account_select is false, returns a challenge if the job type if verification and it has been verified once and single_account_select is true. returns success after a second verification', async () => {
      const userId = 'testUserId'

      const successStatus = {
        ...successConnectionStatus,
        user_id: userId
      }

      expect(
        await testAdapter.GetConnectionStatus('test', 'test', true, userId)
      ).toEqual(successStatus)

      await testAdapter.UpdateConnection(
        {
          job_type: MappedJobTypes.VERIFICATION
        } as any,
        userId
      )

      expect(
        await testAdapter.GetConnectionStatus('test', 'test', false, userId)
      ).toEqual(successStatus)

      expect(
        await testAdapter.GetConnectionStatus('test', 'test', true, userId)
      ).toEqual({
        aggregator,
        id: 'testId',
        cur_job_id: 'testJobId',
        user_id: 'testUserId',
        status: ConnectionStatus.CHALLENGED,
        challenges: [
          {
            id: 'CRD-a81b35db-28dd-41ea-aed3-6ec8ef682011',
            type: 1,
            question: 'Please select an account:',
            data: [
              {
                key: 'Checking',
                value: 'act-23445745'
              },
              {
                key: 'Savings',
                value: 'act-352386787'
              }
            ]
          }
        ]
      })

      await testAdapter.UpdateConnection(
        {
          job_type: MappedJobTypes.VERIFICATION
        } as any,
        userId
      )

      expect(
        await testAdapter.GetConnectionStatus('test', 'test', false, userId)
      ).toEqual(successStatus)

      expect(
        await testAdapter.GetConnectionStatus('test', 'test', true, userId)
      ).toEqual(successStatus)
    })
  })

  describe('UpdateConnection', () => {
    it('returns a response object', async () => {
      expect(
        await testAdapter.UpdateConnection(
          {
            job_type: MappedJobTypes.AGGREGATE
          } as any,
          'test'
        )
      ).toEqual({
        id: 'testId',
        cur_job_id: 'testJobId',
        institution_code: 'testCode',
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        aggregator
      })
    })
  })

  describe('UpdateConnectionInternal', () => {
    it('returns a response object', async () => {
      expect(
        await testAdapter.UpdateConnectionInternal(undefined, 'test')
      ).toEqual({
        id: 'testId',
        cur_job_id: 'testJobId',
        institution_code: 'testCode',
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        aggregator
      })
    })
  })

  describe('GetConnectionById', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.GetConnectionById(undefined, 'test')).toEqual({
        id: 'testId',
        institution_code: 'testCode',
        is_oauth: false,
        is_being_aggregated: false,
        oauth_window_uri: undefined,
        aggregator,
        user_id: 'test'
      })
    })
  })

  describe('GetConnectionStatus', () => {
    it('returns a response object', async () => {
      expect(
        await testAdapter.GetConnectionStatus('test', 'test', false, 'userId')
      ).toEqual(successConnectionStatus)
    })
  })

  describe('AnswerChallenge', () => {
    it('returns a response object', async () => {
      expect(
        await testAdapter.AnswerChallenge(undefined, 'test', 'test')
      ).toEqual(true)
    })
  })

  describe('ResolveUserId', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.ResolveUserId('userId', false)).toEqual('userId')
    })
  })
})
