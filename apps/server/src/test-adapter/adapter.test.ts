import { ConnectionStatus } from '@repo/utils'
import { TestAdapter } from './adapter'
import { PROVIDER_STRING } from './constants'

const testAdapter = new TestAdapter()

describe('TestAdapter', () => {
  describe('GetInstitutionById', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.GetInstitutionById('test')).toEqual({
        id: 'testid',
        logo_url:
          'https://content.moneydesktop.com/storage/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
        name: 'testname',
        oauth: false,
        provider: 'testExample',
        url: 'testurl'
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
          label: 'Test Example Field Label'
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
          provider: PROVIDER_STRING
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
          label: 'testFieldLabel'
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
        provider: PROVIDER_STRING
      })
    })
  })

  describe('UpdateConnection', () => {
    it('returns a response object', async () => {
      expect(await testAdapter.UpdateConnection(undefined, 'test')).toEqual({
        id: 'testId',
        cur_job_id: 'testJobId',
        institution_code: 'testCode',
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        provider: PROVIDER_STRING
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
        provider: PROVIDER_STRING
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
        provider: PROVIDER_STRING,
        user_id: 'test'
      })
    })
  })

  describe('GetConnectionStatus', () => {
    it('returns a response object', async () => {
      expect(
        await testAdapter.GetConnectionStatus('test', 'test', false, 'userId')
      ).toEqual({
        provider: PROVIDER_STRING,
        id: 'testId',
        cur_job_id: 'testJobId',
        user_id: 'userId',
        status: ConnectionStatus.CONNECTED,
        challenges: []
      })
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
