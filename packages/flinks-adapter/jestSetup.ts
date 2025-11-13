import { server } from "./src/test/testServer";
import { clearRedisMock } from "@repo/utils/test";

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  clearRedisMock();
});

afterAll(() => server.close());
