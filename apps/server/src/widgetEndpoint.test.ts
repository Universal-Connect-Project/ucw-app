import { Request, Response } from 'express'
import { widgetHandler } from './widgetEndpoint'
import { JobTypes } from './shared/contract'

describe('server', () => {
  describe('widgetHandler', () => {
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
  })
})
