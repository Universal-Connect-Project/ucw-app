import { Request, Response } from 'express'
import getVC from '../services/vcProviders'

export interface AccountsDataQueryParameters {
  connectionId: string
  provider: string
  userId: string
}

export const accountsDataHandler = async (req: Request, res: Response) => {
  const { provider, connectionId, userId } =
    req.query as unknown as AccountsDataQueryParameters

  try {
    const vc = await getVC(provider, connectionId, 'accounts', userId)
    res.send({
      jwt: vc
    })
  } catch (error) {
    res.status(400)
    res.send('Something went wrong')
  }
}

export interface IdentityDataQueryParameters {
  connectionId: string
  provider: string
  userId: string
}

export const identityDataHandler = async (req: Request, res: Response) => {
  const { provider, connectionId, userId } =
    req.query as unknown as IdentityDataQueryParameters

  try {
    const vc = await getVC(provider, connectionId, 'identity', userId)
    res.send({
      jwt: vc
    })
  } catch (error) {
    res.status(400)
    res.send('Something went wrong')
  }
}

export interface TransactionsDataQueryParameters {
  accountId: string
  endTime: string
  provider: string
  startTime: string
  userId: string
}

export const transactionsDataHandler = async (req: Request, res: Response) => {
  const { provider, userId, accountId, startTime, endTime } =
    req.query as unknown as TransactionsDataQueryParameters

  try {
    const vc = await getVC(
      provider,
      undefined,
      'transactions',
      userId,
      accountId,
      startTime,
      endTime
    )
    res.send({
      jwt: vc
    })
  } catch (error) {
    res.status(400)
    res.send('Something went wrong')
  }
}
