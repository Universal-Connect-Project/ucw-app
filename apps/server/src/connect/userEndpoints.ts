import type { Response } from 'express'
import Joi from 'joi'
import { getProviderAdapter } from '../adapters'
import { createProviderValidator } from '../utils'
interface UserDeleteParameters {
  provider: string
  userId: string
}

export interface UserDeleteRequest {
  params: UserDeleteParameters
}

export const userDeleteHandler = async (
  req: UserDeleteRequest,
  res: Response
) => {
  const schema = Joi.object({
    provider: createProviderValidator(),
    userId: Joi.string().required()
  })

  const { error } = schema.validate(req.params)

  if (error) {
    res.status(400)
    res.send(error.details[0].message)

    return
  }

  const { userId, provider } = req.params

  try {
    const providerAdapter = getProviderAdapter(provider)
    const failIfUserNotFound = true
    const providerUserId = await providerAdapter.ResolveUserId(
      userId,
      failIfUserNotFound
    )
    const ret = await providerAdapter.DeleteUser(providerUserId)
    res.status(ret.status)
    res.send(ret.data)
  } catch (error) {
    res.status(400)
    res.send('User delete failed')
  }
}
