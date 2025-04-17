import { clearRedisMock } from "@repo/utils/test";
import { server } from "./src/test/testServer";

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();

  clearRedisMock();
});

afterAll(() => server.close());
