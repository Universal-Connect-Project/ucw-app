import { Request, Response } from 'express'
import {
  AccountsDataQueryParameters,
  IdentityDataQueryParameters,
  TransactionsDataQueryParameters,
  accountsDataHandler,
  identityDataHandler,
  transactionsDataHandler
} from './dataEndpoints'
import {
  mxVcAccountsData,
  mxVcIdentityData,
  mxVcTranscationsData
} from '../test/testData/mxVcData'
import { server } from '../test/testServer'
import { HttpResponse, http } from 'msw'
import {
  MX_VC_GET_ACCOUNTS_PATH,
  MX_VC_GET_IDENTITY_PATH,
  MX_VC_GET_TRANSACTIONS_PATH
} from '../test/handlers'

describe('dataEndpoints', () => {
  describe('accountsDataHandler', () => {
    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn()
      } as unknown as Response

      const req = {
        query: {
          connectionId: 'testConnectionId',
          provider: 'mx',
          userId: 'testUserId'
        } as AccountsDataQueryParameters
      } as unknown as Request

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

      const req = {
        query: {
          connectionId: 'testConnectionId',
          provider: 'mx',
          userId: 'testUserId'
        } as AccountsDataQueryParameters
      } as unknown as Request

      await accountsDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('Something went wrong')
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('identityDataHandler', () => {
    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req = {
        query: {
          connectionId: 'testConnectionId',
          provider: 'mx',
          userId: 'testUserId'
        } as IdentityDataQueryParameters
      } as unknown as Request

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

      const req = {
        query: {
          connectionId: 'testConnectionId',
          provider: 'mx',
          userId: 'testUserId'
        } as IdentityDataQueryParameters
      } as unknown as Request

      await identityDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('Something went wrong')
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('transactionsDataHandler', () => {
    it('responds with the vc data in the jwt on success', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req = {
        query: {
          accountId: 'testAccountId',
          provider: 'mx',
          userId: 'testUserId'
        } as TransactionsDataQueryParameters
      } as unknown as Request

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

      const req = {
        query: {
          accountId: 'testAccountId',
          provider: 'mx',
          userId: 'testUserId'
        } as TransactionsDataQueryParameters
      } as unknown as Request

      await transactionsDataHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('Something went wrong')
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
