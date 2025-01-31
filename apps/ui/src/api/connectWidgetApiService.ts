import configuredAxios from "./axios";

export const RECOMMENDED_INSTITUTIONS_URL = "/institutions/recommended";

interface LoadInstitutionsParams {
  routing_number?: number;
  search_name?: string;
}

const connectWidgetApiService = {
  loadPopularInstitutions: async () => {
    return configuredAxios
      .get(RECOMMENDED_INSTITUTIONS_URL)
      .then((response) => response.data);
  },
  loadInstitutions: async ({
    routing_number,
    search_name,
  }: LoadInstitutionsParams) => {
    return configuredAxios
      .get("/institutions", {
        params: { routingNumber: routing_number, search: search_name },
      })
      .then((response) => response.data);
  },
};

export default connectWidgetApiService;
