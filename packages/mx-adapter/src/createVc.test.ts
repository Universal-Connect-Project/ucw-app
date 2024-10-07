import { VCDataTypes } from './contract.js'

import {
  mxVcAccountsData,
  mxVcIdentityData,
  mxVcIntegrationAccountsData,
  mxVcTranscationsData
} from './test/testData/mxVcData.js'
import { mxIntGetVC, mxProdGetVC } from './createVc.js'
import { logClient } from "./__mocks__/logClient.js";
import { aggregatorCredentials } from "./adapter.test.js";


const dependencies = {
  logClient,
  aggregatorCredentials
};


describe('getVc', () => {
  const connectionId = 'connectionId'
  const userId = 'userId'
  const accountId = 'accountId'

  it('gets accounts VC from INT environment', async () => {
    const vc = await mxIntGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId
    })
    expect(vc).toEqual(mxVcIntegrationAccountsData)
  })

  it('gets identity VC from Prod environment', async () => {
    const vc = await mxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.IDENTITY,
      userId
    })
    expect(vc).toEqual(mxVcIdentityData)
  })

  it('gets accounts VC from Prod environment', async () => {
    const vc = await mxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.ACCOUNTS,
      userId
    })
    expect(vc).toEqual(mxVcAccountsData)
  })

  it('gets transactions VC from Prod environment', async () => {
    const vc = await mxProdGetVC(dependencies)({
      connectionId,
      type: VCDataTypes.TRANSACTIONS,
      userId,
      accountId
    })
    expect(vc).toEqual(mxVcTranscationsData)
  })
})
