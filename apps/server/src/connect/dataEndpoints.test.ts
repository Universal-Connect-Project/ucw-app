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

const providerErrorText = `"provider" must be one of [${Object.values(Providers).join(', ')}]`

describe('dataEndpoints', () => {
  describe('accountsDataHandler', () => {
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
    describe('validation', () => {
      it('responds with a failure if connection_id is missing', async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        await identityDataHandler(
          {
            query: {
              provider: Providers.MX,
              user_id: 'testUserId'
            }
          } as IdentityRequest,
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

        await identityDataHandler(
          {
            query: {
              connection_id: 'testConnectionId',
              provider: Providers.MX
            }
          } as IdentityRequest,
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

        await identityDataHandler(
          {
            query: {
              connection_id: 'testConnectionId',
              provider: 'junk',
              user_id: 'testUserId'
            }
          } as IdentityRequest,
          res
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.send).toHaveBeenCalledWith(
          `"provider" must be one of [${Object.values(Providers).join(', ')}]`
        )
      })
    })

    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: IdentityRequest = {
        query: {
          connection_id: 'testConnectionId',
          provider: Providers.MX,
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
          provider: Providers.MX,
          user_id: 'testUserId'
        }
      }

      await identityDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('Something went wrong')
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('transactionsDataHandler', () => {
    describe('validation', () => {
      it('responds with a 400 if account_id is missing', async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        const req: TransactionsRequest = {
          query: {
            provider: Providers.MX,
            user_id: 'testUserId',
            start_time: undefined,
            end_time: undefined
          }
        } as TransactionsRequest

        await transactionsDataHandler(req, res)

        expect(res.send).toHaveBeenCalledWith('"account_id" is required')
        expect(res.status).toHaveBeenCalledWith(400)
      })

      it('responds with a 400 if provider is wrong', async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        const req: TransactionsRequest = {
          query: {
            account_id: 'testAccountId',
            provider: 'junk',
            user_id: 'testUserId',
            start_time: undefined,
            end_time: undefined
          }
        } as TransactionsRequest

        await transactionsDataHandler(req, res)

        expect(res.send).toHaveBeenCalledWith(providerErrorText)
        expect(res.status).toHaveBeenCalledWith(400)
      })

      it('responds with a 400 if user_id is missing', async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        const req: TransactionsRequest = {
          query: {
            account_id: 'testAccountId',
            provider: Providers.MX,
            start_time: undefined,
            end_time: undefined
          }
        } as TransactionsRequest

        await transactionsDataHandler(req, res)

        expect(res.send).toHaveBeenCalledWith('"user_id" is required')
        expect(res.status).toHaveBeenCalledWith(400)
      })

      it('doesnt respond with a 400 if its mx and there is no start or end time', async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        const req: TransactionsRequest = {
          query: {
            account_id: 'testAccountId',
            provider: Providers.MX,
            user_id: 'testUserId'
          }
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
          query: {
            account_id: 'testAccountId',
            provider: Providers.SOPHTRON,
            user_id: 'testUserId',
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
          query: {
            account_id: 'testAccountId',
            provider: Providers.SOPHTRON,
            user_id: 'testUserId',
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
        query: {
          account_id: 'testAccountId',
          provider: Providers.MX,
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
          provider: Providers.MX,
          user_id: 'testUserId',
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
