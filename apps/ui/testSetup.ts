import { afterAll, afterEach, beforeAll } from "vitest";
import server from "./src/shared/test/testServer";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterAll(() => server.close());

afterEach(() => server.resetHandlers());
