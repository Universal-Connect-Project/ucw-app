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
import { invalidProviderString } from '../utils/validators'

describe('dataEndpoints', () => {
  describe('accountsDataHandler', () => {
    it('responds with a failure if provider isnt valid', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      await accountsDataHandler(
        {
          params: {
            connectionId: 'testConnectionId',
            provider: 'junk',
            userId: 'testUserId'
          }
        } as AccountsRequest,
        res
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith(invalidProviderString)
    })

    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn()
      } as unknown as Response

      const req: AccountsRequest = {
        params: {
          connectionId: 'testConnectionId',
          provider: Providers.MX,
          userId: 'testUserId'
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
        params: {
          connectionId: 'testConnectionId',
          provider: Providers.MX,
          userId: 'testUserId'
        }
      }

      await accountsDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('Something went wrong')
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('identityDataHandler', () => {
    it('responds with a failure if provider isnt valid', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      await identityDataHandler(
        {
          params: {
            connectionId: 'testConnectionId',
            provider: 'junk',
            userId: 'testUserId'
          }
        } as IdentityRequest,
        res
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith(invalidProviderString)
    })

    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: IdentityRequest = {
        params: {
          connectionId: 'testConnectionId',
          provider: Providers.MX,
          userId: 'testUserId'
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
        params: {
          connectionId: 'testConnectionId',
          provider: Providers.MX,
          userId: 'testUserId'
        }
      }

      await identityDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('Something went wrong')
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('transactionsDataHandler', () => {
    describe('validation', () => {
      it('responds with a 400 if provider is wrong', async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        const req: TransactionsRequest = {
          params: {
            accountId: 'testAccountId',
            provider: 'junk',
            userId: 'testUserId'
          },
          query: {
            start_time: undefined,
            end_time: undefined
          }
        } as TransactionsRequest

        await transactionsDataHandler(req, res)

        expect(res.send).toHaveBeenCalledWith(invalidProviderString)
        expect(res.status).toHaveBeenCalledWith(400)
      })

      it('doesnt respond with a 400 if its mx and there is no start or end time', async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        const req: TransactionsRequest = {
          params: {
            accountId: 'testAccountId',
            provider: Providers.MX,
            userId: 'testUserId'
          },
          query: {}
        } as TransactionsRequest

        await transactionsDataHandler(req, res)

        expect(res.status).not.toHaveBeenCalledWith(400)
      })

      it('responds with a 400 if its sophtron and there is no start time', async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        const req: TransactionsRequest = {
          params: {
            accountId: 'testAccountId',
            provider: Providers.SOPHTRON,
            userId: 'testUserId'
          },
          query: {
            end_time: 'junk'
          }
        } as TransactionsRequest

        await transactionsDataHandler(req, res)

        expect(res.send).toHaveBeenCalledWith('"start_time" is required')
        expect(res.status).toHaveBeenCalledWith(400)
      })

      it('responds with a 400 if its sophtron and there is no end time', async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        const req: TransactionsRequest = {
          params: {
            accountId: 'testAccountId',
            provider: Providers.SOPHTRON,
            userId: 'testUserId'
          },
          query: {
            start_time: 'junk'
          }
        } as TransactionsRequest

        await transactionsDataHandler(req, res)

        expect(res.send).toHaveBeenCalledWith('"end_time" is required')
        expect(res.status).toHaveBeenCalledWith(400)
      })
    })

    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: TransactionsRequest = {
        params: {
          accountId: 'testAccountId',
          provider: Providers.MX,
          userId: 'testUserId'
        },
        query: {
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
        params: {
          accountId: 'testAccountId',
          provider: Providers.MX,
          userId: 'testUserId'
        },
        query: {
          start_time: undefined,
          end_time: undefined
        }
      }

      await transactionsDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('Something went wrong')
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
