import Joi from 'joi'
import { Providers } from '../shared/contract'

export const createProviderValidator = () =>
  Joi.string()
    .valid(...Object.values(Providers))
    .required()
