/* eslint-disable @typescript-eslint/naming-convention */
import type { Response } from 'express'
import Joi from 'joi'
import { getProviderAdapter } from '../adapters'
import getVC from '../services/vcProviders'
import { Providers } from '../shared/contract'

export interface AccountsDataQueryParameters {
  connectionId: string
  provider: string
  userId: string
}

export interface AccountsRequest {
  params: AccountsDataQueryParameters
}

export interface IdentityRequest {
  params: IdentityDataParameters
}

export interface TransactionsRequest {
  query: TransactionsDataQueryParameters
  params: TransactionsDataPathParameters
}

export const accountsDataHandler = async (
  req: AccountsRequest,
  res: Response
) => {
  const { provider, connectionId, userId } = req.params

  const providerAdapter = getProviderAdapter(provider)
  const providerUserId = await providerAdapter.ResolveUserId(userId)

  try {
    const vc = await getVC(provider, connectionId, 'accounts', providerUserId)
    res.send({
      jwt: vc
    })
  } catch (error) {
    res.status(400)
    res.send('Something went wrong')
  }
}

export interface IdentityDataParameters {
  connectionId: string
  provider: string
  userId: string
}

export const identityDataHandler = async (
  req: IdentityRequest,
  res: Response
) => {
  const { provider, connectionId, userId } =
    req.params as IdentityDataParameters

  const providerAdapter = getProviderAdapter(provider)
  const providerUserId = await providerAdapter.ResolveUserId(userId)

  try {
    const vc = await getVC(provider, connectionId, 'identity', providerUserId)
    res.send({
      jwt: vc
    })
  } catch (error) {
    res.status(400)
    res.send('Something went wrong')
  }
}

export interface TransactionsDataQueryParameters {
  end_time: string
  start_time: string
}

export interface TransactionsDataPathParameters {
  accountId: string
  provider: string
  userId: string
}

export const transactionsDataHandler = async (
  req: TransactionsRequest,
  res: Response
) => {
  const { accountId, provider, userId } =
    req.params as TransactionsDataPathParameters

  const schema = Joi.object({
    end_time:
      provider === Providers.SOPHTRON ? Joi.string().required() : Joi.string(),
    start_time:
      provider === Providers.SOPHTRON ? Joi.string().required() : Joi.string()
  })

  const { error } = schema.validate(req.query)

  if (error) {
    res.status(400)
    res.send(error.details[0].message)

    return
  }

  const { start_time, end_time } = req.query as TransactionsDataQueryParameters

  const providerAdapter = getProviderAdapter(provider)
  const providerUserId = await providerAdapter.ResolveUserId(userId)

  try {
    const vc = await getVC(
      provider,
      undefined,
      'transactions',
      providerUserId,
      accountId,
      start_time,
      end_time
    )
    res.send({
      jwt: vc
    })
  } catch (error) {
    res.status(400)
    res.send('Something went wrong')
  }
}
