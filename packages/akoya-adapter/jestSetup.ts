import { server } from "./src/test/testServer";
import { clearRedisMock } from "./src/test/utils/cacheClient";

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => server.close());
