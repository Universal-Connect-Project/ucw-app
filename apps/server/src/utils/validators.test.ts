import type { Request, Response } from 'express'
import { invalidAggregatorString, withValidateAggregatorInPath } from './validators'
import { Aggregators } from '../shared/contract'

const successString = 'success!'

const validatedHandler = withValidateAggregatorInPath(
  (req: Request, res: Response) => {
    res.send(successString)
  }
)

describe('validators', () => {
  describe('withValidateAggregatorInPath', () => {
    it("fails with an error if the aggregator is missing and doesn't call the handler", () => {
      const req = {
        params: {}
      }

      const res = {
        send: jest.fn(),
        status: jest.fn()
      }

      validatedHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('"aggregator" is required')
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).not.toHaveBeenCalledWith(successString)
    })

    it("fails with an error if the aggregator is wrong and doesn't call the handler", () => {
      const req = {
        params: {
          aggregator: 'junk'
        }
      }

      const res = {
        send: jest.fn(),
        status: jest.fn()
      }

      validatedHandler(req, res)

      expect(res.send).toHaveBeenCalledWith(invalidAggregatorString)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).not.toHaveBeenCalledWith(successString)
    })

    it('calls the handler if the aggregator is valid', () => {
      const req = {
        params: {
          aggregator: Aggregators.MX
        }
      }

      const res = {
        send: jest.fn(),
        status: jest.fn()
      }

      validatedHandler(req, res)

      expect(res.send).not.toHaveBeenCalledWith(invalidAggregatorString)
      expect(res.status).not.toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith(successString)
    })
  })
})
