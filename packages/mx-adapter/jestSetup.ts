import { server } from "./src/test/testServer";
import { clearRedisMock } from "./src/test/utils/cacheClient";

beforeAll(() => {
  server.listen();
  // initializeDefaultElasticSearchHandlers()
});

afterEach(() => {
  server.resetHandlers();
  // resetDefaultElasticSearchHandlers()
  clearRedisMock();
});

afterAll(() => server.close());
