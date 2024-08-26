import type { Response } from 'express'
import { getProviderAdapter } from '../adapterSetup'
import { withValidateProviderInPath } from '../utils/validators'
interface UserDeleteParameters {
  provider: string
  userId: string
}

export interface UserDeleteRequest {
  params: UserDeleteParameters
}

export const userDeleteHandler = withValidateProviderInPath(
  async (req: UserDeleteRequest, res: Response) => {
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
)
