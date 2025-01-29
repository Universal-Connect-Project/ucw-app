import { describe, expect, it, vi } from "vitest";
import { render, screen } from "./shared/test/testUtils";
import server from "./shared/test/testServer";
const mockedWidgetText = "mockedConnectWidget";

vi.mock("./Widget", () => ({
  default: () => mockedWidgetText,
}));

import App from "./App";
import { http, HttpResponse } from "msw";
import { INSTRUMENTATION_URL } from "./connect/api";

describe("<App />", () => {
  it("doesn't render the widget until instrumentation succeeds", async () => {
    render(<App />);

    expect(screen.queryByText(mockedWidgetText)).not.toBeInTheDocument();

    expect(await screen.findByText(mockedWidgetText)).toBeInTheDocument();
  });

  it("shows the error boundary if instrumentation fails", async () => {
    server.use(
      http.post(
        INSTRUMENTATION_URL,
        () => new HttpResponse(null, { status: 400 }),
      ),
    );

    render(<App />);

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
  });
});
