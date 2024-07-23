import { Request, Response } from 'express'
import { invalidProviderString, withValidateProviderInPath } from './validators'
import { Providers } from '../shared/contract'

const successString = 'success!'

const validatedHandler = withValidateProviderInPath(
  (req: Request, res: Response) => {
    res.send(successString)
  }
)

describe('validators', () => {
  describe('withValidateProviderInPath', () => {
    it("fails with an error if the provider is missing and doesn't call the handler", () => {
      const req = {
        params: {}
      }

      const res = {
        send: jest.fn(),
        status: jest.fn()
      }

      validatedHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('"provider" is required')
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).not.toHaveBeenCalledWith(successString)
    })

    it("fails with an error if the provider is wrong and doesn't call the handler", () => {
      const req = {
        params: {
          provider: 'junk'
        }
      }

      const res = {
        send: jest.fn(),
        status: jest.fn()
      }

      validatedHandler(req, res)

      expect(res.send).toHaveBeenCalledWith(invalidProviderString)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.send).not.toHaveBeenCalledWith(successString)
    })

    it('calls the handler if the provider is valid', () => {
      const req = {
        params: {
          provider: Providers.MX
        }
      }

      const res = {
        send: jest.fn(),
        status: jest.fn()
      }

      validatedHandler(req, res)

      expect(res.send).not.toHaveBeenCalledWith(invalidProviderString)
      expect(res.status).not.toHaveBeenCalledWith(400)
      expect(res.send).toHaveBeenCalledWith(successString)
    })
  })
})
