import Joi from 'joi'
import { providers } from '../adapterSetup'

export const invalidProviderString = `"provider" must be one of [${providers.join(', ')}]`

export const createProviderValidator = () =>
  Joi.string()
    .valid(...providers)
    .required()

export const withValidateProviderInPath =
  // eslint-disable-next-line @typescript-eslint/ban-types
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
