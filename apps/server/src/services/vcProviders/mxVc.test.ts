import getVC from './mxVc'

describe('getVc', () => {
  const connectionId = 'connectionId'
  const userId = 'userId'
  const accountId = 'accountId'

  // TODO: just need to add handlers for all these
  // and expect a jwt token

  it('gets identity VC from INT environment', () => {
    const isProd = false

    const vc = getVC(isProd, connectionId, 'identity', userId, accountId)
    expect(vc).toEqual({})
  })

  // it('gets accounts VC from INT environment', () => {
  //   const isProd = false

  //   const vc = getVC(isProd, connectionId, 'accounts', userId, accountId)
  //   expect(vc).toEqual({})
  // })

  // it('gets transactions VC from INT environment', () => {
  //   const isProd = false

  //   const vc = getVC(isProd, connectionId, 'transactions', userId, accountId)
  //   expect(vc).toEqual({})
  // })

  // it('gets identity VC from Prod environment', () => {
  //   const isProd = false

  //   const vc = getVC(isProd, connectionId, 'identity', userId, accountId)
  //   expect(vc).toEqual({})
  // })

  // it('gets accounts VC from Prod environment', () => {
  //   const isProd = false

  //   const vc = getVC(isProd, connectionId, 'accounts', userId, accountId)
  //   expect(vc).toEqual({})
  // })

  // it('gets transactions VC from Prod environment', () => {
  //   const isProd = false

  //   const vc = getVC(isProd, connectionId, 'transactions', userId, accountId)
  //   expect(vc).toEqual({})
  // })
})
