import {
  initializeDefaultElasticSearchHandlers,
  resetDefaultElasticSearchHandlers
} from './src/test/elasticSearchHandlers'
import { server } from './src/test/testServer'
import { clearRedisMock } from './src/__mocks__/redis'

beforeAll(() => {
  server.listen()
  initializeDefaultElasticSearchHandlers()
})

afterEach(() => {
  server.resetHandlers()
  resetDefaultElasticSearchHandlers()
  clearRedisMock()
})

afterAll(() => server.close())
