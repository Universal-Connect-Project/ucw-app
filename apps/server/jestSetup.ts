import { initializeDefaultElasticSearchHandlers, resetDefaultElasticSearchHandlers } from './src/test/elasticSearchHandlers'
import { server } from './src/test/testServer'
 
beforeAll(() => {
  server.listen()
  initializeDefaultElasticSearchHandlers()
})

afterEach(() => {
  server.resetHandlers()
  resetDefaultElasticSearchHandlers()
})

afterAll(() => server.close())
