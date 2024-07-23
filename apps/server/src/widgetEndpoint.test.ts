import { Request, Response } from 'express'
import { widgetHandler } from './widgetEndpoint'
import { JobTypes, Providers } from './shared/contract'
import { invalidProviderString } from './utils/validators'

describe('server', () => {
  describe('widgetHandler', () => {
    describe('validation', () => {
      it('responds with a 400 if job_type is missing', () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        widgetHandler(
          {
            query: {
              user_id: 'testUserId'
            }
          } as unknown as Request,
          res
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.send).toHaveBeenCalledWith('"job_type" is required')
      })

      it('responds with a 400 if job_type is invalid', () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        widgetHandler(
          {
            query: {
              job_type: 'junk',
              user_id: 'testUserId'
            }
          } as unknown as Request,
          res
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.send).toHaveBeenCalledWith(
          `"job_type" must be one of [${Object.values(JobTypes).join(', ')}]`
        )
      })

      it('responds with a 400 if user_id is missing', () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        widgetHandler(
          {
            query: {
              job_type: JobTypes.AGGREGATE
            }
          } as unknown as Request,
          res
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.send).toHaveBeenCalledWith('"user_id" is required')
      })

      it('responds with a 400 if provider is invalid', () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        widgetHandler(
          {
            query: {
              job_type: JobTypes.AGGREGATE,
              provider: 'junk',
              user_id: 'testUserId'
            }
          } as unknown as Request,
          res
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.send).toHaveBeenCalledWith(invalidProviderString)
      })

      it('responds with a 400 if provider is provided without a connection_id', () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        widgetHandler(
          {
            query: {
              job_type: JobTypes.AGGREGATE,
              provider: Providers.MX,
              user_id: 'testUserId'
            }
          } as unknown as Request,
          res
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.send).toHaveBeenCalledWith(
          '"value" contains [provider] without its required peers [connection_id]'
        )
      })

      it('responds with a 400 if connection_id is provided without a provider', () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        widgetHandler(
          {
            query: {
              connection_id: 'testConnectionId',
              job_type: JobTypes.AGGREGATE,
              user_id: 'testUserId'
            }
          } as unknown as Request,
          res
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.send).toHaveBeenCalledWith(
          '"value" contains [connection_id] without its required peers [provider]'
        )
      })

      it('responds with a 400 if single_account_select isnt a bool', () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        widgetHandler(
          {
            query: {
              job_type: JobTypes.AGGREGATE,
              single_account_select: 'junk',
              user_id: 'testUserId'
            }
          } as unknown as Request,
          res
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.send).toHaveBeenCalledWith(
          '"single_account_select" must be a boolean'
        )
      })
    })
  })
})
