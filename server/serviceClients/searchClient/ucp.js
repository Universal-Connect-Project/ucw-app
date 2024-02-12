const http = require('../../infra/http');
const config = require('../../config');

export class SearchClient{
  token;
  
  constructor(token){
    this.token = token;
  }

  async institutions(name, providers){
    providers = providers || []
    let url = `${config.SearchEndpoint}institutions?query=${encodeURIComponent(name || '')}&providers=${providers.join(';')}`;
    return http.get(url, {Authorization: `token ${this.token}`})
  }

  resolve(id){
    return http.get(`${config.SearchEndpoint}institution/resolve?id=${id}`, {Authorization: `token ${this.token}`})
  }
}