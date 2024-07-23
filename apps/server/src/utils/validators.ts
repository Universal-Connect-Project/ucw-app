import Joi from 'joi'
import { Providers } from '../shared/contract'

export const invalidProviderString = `"provider" must be one of [${Object.values(Providers).join(', ')}]`

export const createProviderValidator = () =>
  Joi.string()
    .valid(...Object.values(Providers))
    .required()

export const withValidateProviderInPath =
  (handler: Function) => async (req: any, res: any) => {
    const schema = Joi.object({
      provider: createProviderValidator()
    })

    const { error } = schema.validate({
      provider: req.params.provider
    })

    if (error) {
      res.status(400)
      res.send(error.details[0].message)

      return
    }

    await handler(req, res)
  }
