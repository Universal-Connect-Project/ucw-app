import config from '../../config'
import { get } from '../../infra/http'

export class SearchClient {
  token

  constructor (token) {
    this.token = token
  }

  async institutions (name, providers) {
    providers = providers ?? []
    const url = `${config.SearchEndpoint}institutions?query=${encodeURIComponent(name ?? '')}&providers=${providers.join(';')}`
    console.log('\ntoken', this.token, '\n\n')
    return await get(url, { Authorization: `token ${this.token}` })
  }

  async resolve (id) {
    return await get(`${config.SearchEndpoint}institution/resolve?id=${id}`, { Authorization: `token ${this.token}` })
  }
}
