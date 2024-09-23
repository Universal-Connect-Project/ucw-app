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
import type { Aggregator } from '../shared/contract'
import { Aggregators } from '../shared/contract'
import { invalidAggregatorString } from '../utils/validators'

/* eslint-disable @typescript-eslint/unbound-method */

describe('dataEndpoints', () => {
  describe('accountsDataHandler', () => {
    it('responds with a failure if aggregator isnt valid', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      await accountsDataHandler(
        {
          params: {
            connectionId: 'testConnectionId',
            aggregator: 'junk' as Aggregator,
            userId: 'testUserId'
          }
        },
        res
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString)
    })

    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn()
      } as unknown as Response

      const req: AccountsRequest = {
        params: {
          connectionId: 'testConnectionId',
          aggregator: Aggregators.MX,
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
          aggregator: Aggregators.MX,
          userId: 'testUserId'
        }
      }

      await accountsDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('Something went wrong')
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('identityDataHandler', () => {
    it('responds with a failure if aggregator isnt valid', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      await identityDataHandler(
        {
          params: {
            connectionId: 'testConnectionId',
            aggregator: 'junk',
            userId: 'testUserId'
          }
        },
        res
      )

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString)
    })

    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: IdentityRequest = {
        params: {
          connectionId: 'testConnectionId',
          aggregator: Aggregators.MX,
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
          aggregator: Aggregators.MX,
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
      it('responds with a 400 if aggregator is wrong', async () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        const req: TransactionsRequest = {
          params: {
            accountId: 'testAccountId',
            aggregator: 'junk' as Aggregator,
            userId: 'testUserId'
          },
          query: {
            start_time: undefined,
            end_time: undefined
          }
        }

        await transactionsDataHandler(req, res)

        expect(res.send).toHaveBeenCalledWith(invalidAggregatorString)
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
            aggregator: Aggregators.MX,
            userId: 'testUserId'
          },
          query: {
            end_time: undefined,
            start_time: undefined
          }
        }

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
            aggregator: Aggregators.SOPHTRON,
            userId: 'testUserId'
          },
          query: {
            end_time: 'junk',
            start_time: undefined
          }
        }

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
            aggregator: Aggregators.SOPHTRON,
            userId: 'testUserId'
          },
          query: {
            end_time: undefined,
            start_time: 'junk'
          }
        }

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
          aggregator: Aggregators.MX,
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
          aggregator: Aggregators.MX,
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
