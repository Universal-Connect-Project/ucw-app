import { elasticSearchInstitutionData } from '../test/testData/institution'
import { ElasticSearchMock } from './elasticSearchMock'

const GET_INSTITUTION = { method: 'GET', path: '/institutions/_doc/*' }
const GET_INSTITUTION_RESPONSE = () => {
  return {
    _source: elasticSearchInstitutionData
  }
}

const GET_INSTITUTIONS = {
  method: 'POST',
  path: ['/_search', '/institutions/_search']
}
const GET_INSTITUTIONS_RESPONSE = () => {
  return {
    hits: {
      hits: [
        { _source: elasticSearchInstitutionData },
        { _source: elasticSearchInstitutionData }
      ]
    }
  }
}

const GET_FAVORITE_INSTITUTIONS = { method: 'POST', path: '/_mget' }
const GET_FAVORITE_INSTITUTIONS_RESPONSE = () => {
  return { docs: [{ _source: elasticSearchInstitutionData }] }
}

export function initializeDefaultElasticSearchHandlers() {
  ElasticSearchMock.add(GET_INSTITUTION, GET_INSTITUTION_RESPONSE)
  ElasticSearchMock.add(GET_INSTITUTIONS, GET_INSTITUTIONS_RESPONSE)
  ElasticSearchMock.add(
    GET_FAVORITE_INSTITUTIONS,
    GET_FAVORITE_INSTITUTIONS_RESPONSE
  )
}

export function resetDefaultElasticSearchHandlers() {
  ElasticSearchMock.clearAll()
  initializeDefaultElasticSearchHandlers()
}
