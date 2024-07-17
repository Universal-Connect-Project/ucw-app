import type { Response } from 'express'
import { HttpResponse, http } from 'msw'
import {
  MX_VC_GET_ACCOUNTS_PATH,
  MX_VC_GET_IDENTITY_PATH,
  MX_VC_GET_TRANSACTIONS_PATH
} from '../test/handlers'
import {
  mxVcAccountsData,
  mxVcIdentityData,
  mxVcTranscationsData
} from '../test/testData/mxVcData'
import { server } from '../test/testServer'
import type {
  AccountsRequest,
  IdentityRequest,
  TransactionsRequest
} from './dataEndpoints'
import {
  accountsDataHandler,
  identityDataHandler,
  transactionsDataHandler
} from './dataEndpoints'
import { Providers } from '../shared/contract'

describe('dataEndpoints', () => {
  describe('accountsDataHandler', () => {
    it('responds with a failure if connection_id is missing', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      await accountsDataHandler(
        {
          query: {
            provider: 'mx',
            user_id: 'testUserId'
          }
        } as AccountsRequest,
        res
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith('"connection_id" is required')
    })

    it('responds with a failure if user_id is missing', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      await accountsDataHandler(
        {
          query: {
            connection_id: 'testConnectionId',
            provider: 'mx'
          }
        } as AccountsRequest,
        res
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith('"user_id" is required')
    })

    it('responds with a failure if provider isnt valid', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      await accountsDataHandler(
        {
          query: {
            connection_id: 'testConnectionId',
            provider: 'junk',
            user_id: 'testUserId'
          }
        } as AccountsRequest,
        res
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith(
        `"provider" must be one of [${Object.values(Providers).join(', ')}]`
      )
    })

    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn()
      } as unknown as Response

      const req: AccountsRequest = {
        query: {
          connection_id: 'testConnectionId',
          provider: 'mx',
          user_id: 'testUserId'
        }
      }

      await accountsDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith({
        jwt: mxVcAccountsData
      })
    })

    it('responds with a 400 on failure', async () => {
      server.use(
        http.get(
          MX_VC_GET_ACCOUNTS_PATH,
          () => new HttpResponse(null, { status: 400 })
        )
      )

      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: AccountsRequest = {
        query: {
          connection_id: 'testConnectionId',
          provider: 'mx',
          user_id: 'testUserId'
        }
      }

      await accountsDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('Something went wrong')
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('identityDataHandler', () => {
    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: IdentityRequest = {
        query: {
          connection_id: 'testConnectionId',
          provider: 'mx',
          user_id: 'testUserId'
        }
      }

      await identityDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith({
        jwt: mxVcIdentityData
      })
    })

    it('responds with a 400 on failure', async () => {
      server.use(
        http.get(
          MX_VC_GET_IDENTITY_PATH,
          () => new HttpResponse(null, { status: 400 })
        )
      )

      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: IdentityRequest = {
        query: {
          connection_id: 'testConnectionId',
          provider: 'mx',
          user_id: 'testUserId'
        }
      }

      await identityDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('Something went wrong')
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('transactionsDataHandler', () => {
    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: TransactionsRequest = {
        query: {
          account_id: 'testAccountId',
          provider: 'mx',
          user_id: 'testUserId',
          start_time: undefined,
          end_time: undefined
        }
      }

      await transactionsDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith({
        jwt: mxVcTranscationsData
      })
    })

    it('responds with a 400 on failure', async () => {
      server.use(
        http.get(
          MX_VC_GET_TRANSACTIONS_PATH,
          () => new HttpResponse(null, { status: 400 })
        )
      )

      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: TransactionsRequest = {
        query: {
          account_id: 'testAccountId',
          provider: 'mx',
          user_id: 'testUserId',
          start_time: undefined,
          end_time: undefined
        }
      }

      await transactionsDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('Something went wrong')
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
