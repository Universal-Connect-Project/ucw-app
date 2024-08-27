/* eslint-disable @typescript-eslint/naming-convention */
import type { Response } from 'express'
import Joi from 'joi'
import { Providers } from '../shared/contract'
import { withValidateProviderInPath } from '../utils/validators'
import getVC, { getProviderAdapter } from '../adapterSetup'
import { VCDataTypes } from '@repo/utils'

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

export const accountsDataHandler = withValidateProviderInPath(
  async (req: AccountsRequest, res: Response) => {
    const { provider, connectionId, userId } = req.params

    const providerAdapter = getProviderAdapter(provider)
    const providerUserId = await providerAdapter.ResolveUserId(userId)

    try {
      const vc = await getVC({
        provider,
        connectionId,
        type: VCDataTypes.ACCOUNTS,
        userId: providerUserId
      })
      res.send({
        jwt: vc
      })
    } catch (error) {
      res.status(400)
      res.send('Something went wrong')
    }
  }
)

export interface IdentityDataParameters {
  connectionId: string
  provider: string
  userId: string
}

export const identityDataHandler = withValidateProviderInPath(
  async (req: IdentityRequest, res: Response) => {
    const { provider, connectionId, userId } = req.params

    const providerAdapter = getProviderAdapter(provider)
    const providerUserId = await providerAdapter.ResolveUserId(userId)

    try {
      const vc = await getVC({
        provider,
        connectionId,
        type: VCDataTypes.IDENTITY,
        userId: providerUserId
      })
      res.send({
        jwt: vc
      })
    } catch (error) {
      res.status(400)
      res.send('Something went wrong')
    }
  }
)

export interface TransactionsDataQueryParameters {
  end_time: string
  start_time: string
}

export interface TransactionsDataPathParameters {
  accountId: string
  provider: string
  userId: string
}

export const transactionsDataHandler = withValidateProviderInPath(
  async (req: TransactionsRequest, res: Response) => {
    const { accountId, provider, userId } = req.params

    const schema = Joi.object({
      end_time:
        provider === Providers.SOPHTRON
          ? Joi.string().required()
          : Joi.string(),
      start_time:
        provider === Providers.SOPHTRON ? Joi.string().required() : Joi.string()
    })

    const { error } = schema.validate(req.query)

    if (error) {
      res.status(400)
      res.send(error.details[0].message)

      return
    }

    const { start_time, end_time } = req.query

    const providerAdapter = getProviderAdapter(provider)
    const providerUserId = await providerAdapter.ResolveUserId(userId)

    try {
      const vc = await getVC({
        provider,
        type: VCDataTypes.TRANSACTIONS,
        userId: providerUserId,
        accountId,
        startTime: start_time,
        endTime: end_time
      })
      res.send({
        jwt: vc
      })
    } catch (error) {
      res.status(400)
      res.send('Something went wrong')
    }
  }
)
