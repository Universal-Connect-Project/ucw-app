import { wget } from '../../infra/http'
import config from '../../config'
export class SearchClient {
  async institutions (name) {
    const url = `${config.SearchEndpoint}institutions?query=${encodeURIComponent(name ?? '')}&partner=${config.OrgName}`
    // return this.get(url)
    return await wget(url)
  }

  async resolve (id) {
    // return this.get(`${SophtronSearchEndpoint}institution/resolve?id=${id}&partner=${config.OrgName}`)
    return await wget(`${config.SearchEndpoint}institution/resolve?id=${id}&partner=${config.OrgName}`)
  }
}
