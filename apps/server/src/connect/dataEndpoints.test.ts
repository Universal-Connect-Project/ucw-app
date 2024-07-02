import { Request, Response } from 'express'
import {
  AccountsDataQueryParameters,
  accountsDataHandler
} from './dataEndpoints'
import { mxVcAccountsData } from '../test/testData/mxVcData'
import { server } from '../test/testServer'
import { HttpResponse, http } from 'msw'
import { MX_VC_GET_ACCOUNTS_PATH } from '../test/handlers'

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
})
