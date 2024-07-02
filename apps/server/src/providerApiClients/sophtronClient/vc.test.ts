import providerCredentials from '../../providerCredentials'
import SophtronVcClient from './vc'

const vcClient = new SophtronVcClient(providerCredentials.sophtron)

describe('Sophtron Vc Client', () => {
  //   it('returns the data from a vc endpoint', async () => {
  //     const response = await vcClient.getVC('')
  //   })
})
