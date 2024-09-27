import { clearRedisMock } from './src/__mocks__/cacheClient'
import { server } from './src/test/testServer'

beforeAll(() => {
  server.listen()
  // initializeDefaultElasticSearchHandlers()
})

afterEach(() => {
  server.resetHandlers()
  // resetDefaultElasticSearchHandlers()
  clearRedisMock()
})

afterAll(() => server.close())
