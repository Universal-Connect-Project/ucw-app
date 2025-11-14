export interface CreateWidgetUrlOptions {
  jobTypes: string[];
  userId: string;
  targetOrigin?: string;
  authToken?: string;
  connectionId?: string;
  institutionId?: string;
  aggregator?: string;
  aggregatorOverride?: string;
  singleAccountSelect?: boolean;
  [key: string]: any;
}

export const createWidgetUrl = (
  options: CreateWidgetUrlOptions,
): Cypress.Chainable<string> => {
  const { authToken, targetOrigin, ...rest } = options;

  const body: any = {
    ...rest,
    targetOrigin: targetOrigin || "http://localhost:8080",
  };

  const headers: any = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return cy
    .request({
      method: "POST",
      url: "/widgetUrl",
      body,
      headers,
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property("widgetUrl");
      return response.body.widgetUrl;
    });
};
