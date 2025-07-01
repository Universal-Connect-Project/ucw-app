import { clearRedisMock } from "./src/__mocks__/redis";
import {
  initializeDefaultElasticSearchHandlers,
  resetDefaultElasticSearchHandlers,
} from "./src/test/elasticSearchHandlers";
import { server } from "./src/test/testServer";

beforeAll(() => {
  server.listen();
  initializeDefaultElasticSearchHandlers();
});

beforeEach(() => {
  clearRedisMock();
  jest.useRealTimers();
});

afterEach(() => {
  server.resetHandlers();
  resetDefaultElasticSearchHandlers();
});

afterAll(() => server.close());
