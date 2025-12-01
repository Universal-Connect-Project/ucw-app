import { clearRedisMock } from "./src/__mocks__/redis";
import {
  initializeDefaultElasticSearchHandlers,
  resetDefaultElasticSearchHandlers,
} from "./src/test/elasticSearchHandlers";
import { server } from "./src/test/testServer";
import { m2mTokenHandler } from "./src/shared/utils/ucpAccessToken";

beforeAll(() => {
  server.listen();
  initializeDefaultElasticSearchHandlers();
});

beforeEach(() => {
  clearRedisMock();
  jest.useRealTimers();
  m2mTokenHandler.clearLocalToken();
  m2mTokenHandler.clearTokenFiles();
});

afterEach(() => {
  server.resetHandlers();
  resetDefaultElasticSearchHandlers();
});

afterAll(() => server.close());
