import type { Request, Response } from 'express'
import { widgetHandler } from './widgetEndpoint'
import { JobTypes, Aggregators } from './shared/contract'
import { invalidAggregatorString } from './utils/validators'

/* eslint-disable @typescript-eslint/unbound-method  */

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

      it('responds with a 400 if aggregator is invalid', () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        widgetHandler(
          {
            query: {
              job_type: JobTypes.AGGREGATE,
              aggregator: 'junk',
              user_id: 'testUserId'
            }
          } as unknown as Request,
          res
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.send).toHaveBeenCalledWith(invalidAggregatorString)
      })

      it('responds with a 400 if aggregator is provided without a connection_id', () => {
        const res = {
          send: jest.fn(),
          status: jest.fn()
        } as unknown as Response

        widgetHandler(
          {
            query: {
              job_type: JobTypes.AGGREGATE,
              aggregator: Aggregators.MX,
              user_id: 'testUserId'
            }
          } as unknown as Request,
          res
        )

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.send).toHaveBeenCalledWith(
          '"value" contains [aggregator] without its required peers [connection_id]'
        )
      })

      it('responds with a 400 if connection_id is provided without a aggregator', () => {
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
          '"value" contains [connection_id] without its required peers [aggregator]'
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
