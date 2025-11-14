import type { APIRequestContext } from "@playwright/test";

export interface CreateWidgetUrlOptions {
  jobTypes?: string[];
  userId: string;
  targetOrigin?: string;
  institutionId?: string;
  connectionId?: string;
  aggregator?: string;
  singleAccountSelect?: boolean;
  aggregatorOverride?: string;
}

export async function createWidgetUrl(
  request: APIRequestContext,
  options: CreateWidgetUrlOptions,
): Promise<string> {
  const body: any = {
    ...options,
    targetOrigin: options.targetOrigin || "http://localhost:8080",
  };

  const response = await request.post("http://localhost:8080/widgetUrl", {
    data: body,
  });

  const responseBody = await response.json();
  return responseBody.widgetUrl;
}
