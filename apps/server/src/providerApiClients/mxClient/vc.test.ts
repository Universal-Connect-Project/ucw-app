import { HttpResponse, http } from 'msw'
import providerCredentials from '../../providerCredentials'
import {
  MX_INTEGRATION_VC_GET_ACCOUNTS_PATH,
  MX_VC_GET_ACCOUNTS_PATH
} from '../../test/handlers'
import { mxVcAccountsData } from '../../test/testData/mxVcData'
import { server } from '../../test/testServer'
import { getVc } from './vc'

const accountsPath = 'users/userId/members/connectionId/accounts'

describe('mx vc', () => {
  describe('MxVcClient', () => {
    it('makes a request with the prod configuration and authorization and returns the verifiable credential', async () => {
      let auth

      server.use(
        http.get(MX_VC_GET_ACCOUNTS_PATH, ({ request }) => {
          auth = request.headers.get('Authorization')
          return HttpResponse.json({ verifiableCredential: mxVcAccountsData })
        })
      )

      const response = await getVc(accountsPath, true)

      expect(response).toEqual(mxVcAccountsData)

      expect(auth).toEqual(
        'Basic ' +
          Buffer.from(
            providerCredentials.mxProd.username +
              ':' +
              providerCredentials.mxProd.password
          ).toString('base64')
      )
    })

    it('makes a request with the integration configuration and authorization', async () => {
      let auth

      server.use(
        http.get(MX_INTEGRATION_VC_GET_ACCOUNTS_PATH, ({ request }) => {
          auth = request.headers.get('Authorization')
          return HttpResponse.json({ verifiableCredential: mxVcAccountsData })
        })
      )

      const response = await getVc(accountsPath, false)

      expect(response).toEqual(mxVcAccountsData)

      expect(auth).toEqual(
        'Basic ' +
          Buffer.from(
            providerCredentials.mxInt.username +
              ':' +
              providerCredentials.mxInt.password
          ).toString('base64')
      )
    })

    it('throws an error on request failure', async () => {
      server.use(
        http.get(
          MX_VC_GET_ACCOUNTS_PATH,
          () => new HttpResponse(null, { status: 400 })
        )
      )

      await expect(
        async () => await getVc(accountsPath, true)
      ).rejects.toThrow()
    })
  })
})
