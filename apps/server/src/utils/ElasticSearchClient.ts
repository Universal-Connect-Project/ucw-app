import type { estypes } from '@elastic/elasticsearch'
import { Client } from '@elastic/elasticsearch'
import { readFileSync } from 'fs'
import type { LocalInstitution } from 'src/shared/contract'

export default class ElasticsearchClient {
  private readonly client: Client
  private static _instance: ElasticsearchClient

  private constructor () {
    this.client = new Client({ node: 'http://localhost:9200' })
  }

  static async initialize () {
    const client = this.getInstance().client

    const elasticSearchLoaded = await client.indices.exists({ index: 'institutions' })
    if (!elasticSearchLoaded) {
      await this.reIndexElasticSearch()
    }
  }

  static getInstance () {
    if (this._instance) {
      return this._instance
    }

    this._instance = new ElasticsearchClient()
    return this._instance
  }

  static async reIndexElasticSearch () {
    const client = this.getInstance().client
    try {
      await client.indices.delete({
        index: 'institutions'
      })
    } catch {
      console.log('Elasticsearch "institutions" index did not exist')
    }
    await client.indices.create({ index: 'institutions' })
    console.log('Elasticsearch indexing institutions')
    const dataFilePath = 'ucw_institution_mapping.json'
    const rawData = readFileSync(dataFilePath)
    const jsonData = JSON.parse(rawData.toString())

    for (const institution of jsonData) {
      await client.index({
        index: 'institutions',
        id: institution.ucp_id,
        document: institution
      })
    }
  }

  static async search (searchTerm: string): Promise<any[]> {
    const client = this.getInstance().client
    const searchResults: estypes.SearchResponseBody = await client.search({
      index: 'institutions',
      body: {
        query: {
          multi_match: {
            query: searchTerm,
            fields: ['name', 'keywords']
          }
        }
      }
    })
    return searchResults.hits.hits.map((esObject: estypes.SearchHit) => esObject._source)
  }

  static async getInstitution (id: string): Promise<LocalInstitution> {
    const client = this.getInstance().client

    const institutionResponse = await client.get({
      id,
      index: 'institutions'
    })

    return institutionResponse._source as LocalInstitution
  }

  static async deleteIndex () {
    const client = this.getInstance().client

    try {
      await client.indices.delete({
        index: 'institutions'
      })
    } catch {
      console.log('Elasticsearch "institutions" index did not exist')
    }
  }
}
