import { Request, Response } from 'express'
import getVC from '../services/vcProviders'

interface AccountsDataQueryParameters {
  accountId: string
  connectionId: string
  provider: string
  userId: string
}

export const accountsDataHandler = async (req: Request, res: Response) => {
  const { provider, connectionId, userId, accountId } =
    req.query as unknown as AccountsDataQueryParameters

  try {
    const vc = await getVC(
      provider,
      connectionId,
      'accounts',
      userId,
      accountId
    )
    res.send({
      jwt: vc
    })
  } catch (error) {
    res.status(400)
    res.send('Something went wrong')
  }
}

interface IdentityDataQueryParameters {
  accountId: string
  connectionId: string
  provider: string
  userId: string
}

export const identityDataHandler = async (req: Request, res: Response) => {
  const { provider, connectionId, userId, accountId } =
    req.query as unknown as IdentityDataQueryParameters

  try {
    const vc = await getVC(
      provider,
      connectionId,
      'identity',
      userId,
      accountId
    )
    res.send({
      jwt: vc
    })
  } catch (error) {
    res.status(400)
    res.send('Something went wrong')
  }
}

interface TransactionsDataQueryParameters {
  accountId: string
  connectionId: string
  endTime: string
  provider: string
  startTime: string
  userId: string
}

export const transactionsDataHandler = async (req: Request, res: Response) => {
  const { provider, connectionId, userId, accountId, startTime, endTime } =
    req.query as unknown as TransactionsDataQueryParameters

  try {
    const vc = await getVC(
      provider,
      connectionId,
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
