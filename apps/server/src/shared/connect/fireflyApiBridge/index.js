import ConnectApi from '../../../connect/connectApi'

const context = {}
const api = new ConnectApi({ context })

async function sendStubData(fileName) {
  return await new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const data = require(`services/stubs/${fileName}`)
    resolve(data)
  })
}
const stub = {
  loadMaster: async () => await sendStubData('data_master'),
  loadTransactionRules: async () => await sendStubData('transaction_rules'),
  instrumentation: async () => await sendStubData('instrumentation'),
  loadUserFeatures: async () => await sendStubData('user_features'),
  createAnalyticsSession: async () => await sendStubData('analytics_sessions'),
  loadJob: async (guid) =>
    ({
      guid,
      job_type: 0 // must
    }),
  // loadPopularInstitutions: () => sendStubData('favorite'),

  extendSession: async () => await Promise.resolve(''),
  loadOffer: async () => await Promise.resolve(''),
  dismissOffer: async () => await Promise.resolve(''),
  loadAgreement: async () => await Promise.resolve(''),
  createNewFeatureVisit: async () => await Promise.resolve(''),
  closeFeatureVisit: async () => await Promise.resolve(''),
  sendAnalyticsPageview: async () => await Promise.resolve(''),
  sendAnalyticsEvent: async () => await Promise.resolve(''),
  closeAnalyticsSession: async () => await Promise.resolve(''),
  logout: async () => await Promise.resolve('')
}
const bridge = { ...stub }
for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(api))) {
  bridge[name] = () => api[name]
}
module.exports = new Proxy(bridge, {
  get(target, prop) {
    if (stub[prop]) {
      return async function () {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        debug(`Calling stub method: ${prop}`)
        const ret = await stub[prop].apply(null, arguments)
        debug(JSON.stringify(ret))
        return ret
      }
    }
    if (api[prop]) {
      return async function () {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        debug(`Calling api method: ${prop}`)
        try {
          const ret = await api[prop].apply(api, arguments)
          switch (prop) {
            case 'loadTransactionRules':
              return ret.transaction_rules
            case 'addMember':
              return ret
            case 'loadMemberByGuid':
            case 'updateMember':
              return ret.member
            case 'loadMembers':
              return ret
            case 'getInstitutionCredentials':
            case 'getMemberCredentials':
              return ret.credentials
            case 'loadAccountsByMember':
              return ret.accounts
            case 'loadAccounts':
              return {
                accounts: ret.accounts,
                members: ret.members
              }
            case 'loadInstitutionByUcpId':
            case 'loadInstitutionByCode':
              return {
                ...ret.institution,
                // Remove extra level of nesting
                credentials: ret.institution.credentials.map(
                  (credential) => credential.credential
                )
              }
            case 'loadJob':
              return ret.job
          }
          return ret
        } catch (err) {
          debug(err.message || JSON.stringify(err))
        }
      }
    }
    if (prop !== '$$typeof') {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      debug(`Unstubbed method retrieved ${prop}`)
    }
    return async function () {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      debug(`Unstubbed method called ${prop}`)
      return await Promise.resolve('')
    }
  }
})
