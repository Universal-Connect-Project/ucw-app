import initializeDefaultElasticSearchHandlers from './src/test/elasticSearchHandlers'
import { server } from './src/test/testServer'
 
beforeAll(() => {
  server.listen()
  initializeDefaultElasticSearchHandlers()
})

afterEach(() => {
  server.resetHandlers()
  initializeDefaultElasticSearchHandlers()
})

afterAll(() => server.close())
