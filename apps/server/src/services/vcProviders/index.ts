import { info } from '../../infra/logger'
import { getVC as getMxVc } from '@repo/mx-adapter'
import GetSophtronVc from './sophtronVc'
import { Providers } from '../../shared/contract'

export default async function getVc(
  provider: string,
  connectionId: string,
  type: string,
  userId: string,
  accountId?: string,
  startTime?: string,
  endTime?: string
) {
  info('Getting vc from provider', provider)
  switch (provider) {
    case Providers.MX:
      return getMxVc(true, connectionId, type, userId, accountId)
    case Providers.MXINT:
      return getMxVc(false, connectionId, type, userId, accountId)
    case 'sophtron':
      return await GetSophtronVc(
        connectionId,
        type,
        userId,
        accountId,
        startTime,
        endTime
      )
  }
}
