import type { Response } from 'express'
import { getProviderAdapter } from '../adapters'

interface UserDeleteQueryParameters {
  provider: string
}

export interface UserDeleteRequest {
  query: UserDeleteQueryParameters
  params: {
    userId: string
  }
}

export const userDeleteHandler = async (
  req: UserDeleteRequest,
  res: Response
) => {
  const { provider } = req.query
  const { userId } = req.params
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
