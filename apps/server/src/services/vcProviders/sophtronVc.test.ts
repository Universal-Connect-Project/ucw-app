import getVC from './sophtronVc'

describe('getVc', () => {
  const connectionId = 'connectionId'
  const userId = 'userId'
  const accountId = 'accountId'
  const startTime = '1/1/2024'
  const endTime = '6/1/2024'

  // TODO: just need to add handlers for all these
  // and expect a jwt token

  it('gets identity VC', () => {
    const vc = getVC(
      connectionId,
      'identity',
      userId,
      accountId,
      startTime,
      endTime
    )
    expect(vc).toEqual({})
  })

  // it('gets accounts VC', () => {
  //   const vc = getVC(connectionId, 'accounts', userId, accountId, startTime, endTime)
  //   expect(vc).toEqual({})
  // })

  // it('gets transactions VC', () => {
  //   const vc = getVC(connectionId, 'transactions', userId, accountId, startTime, endTime)
  //   expect(vc).toEqual({})
  // })
})
