import { info } from '../../infra/logger'
import GetMxVc from './mxVc'
import GetSophtronVc from './sophtronVc'

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
    case 'mx':
      return await GetMxVc(true, connectionId, type, userId, accountId)
    case 'mx-int':
    case 'mx_int':
      return await GetMxVc(false, connectionId, type, userId, accountId)
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
