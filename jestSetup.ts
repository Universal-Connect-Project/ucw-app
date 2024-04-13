import { server } from './test/testServer'
 
beforeAll(() => server.listen())

afterEach(() => server.resetHandlers())

afterAll(() => server.close())