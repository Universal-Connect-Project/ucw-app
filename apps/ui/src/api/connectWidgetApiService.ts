import configuredAxios from "./axios";

export const RECOMMENDED_INSTITUTIONS_URL = "/institutions/recommended";
export const SEARCH_INSTITUTIONS_URL = "/institutions";

interface LoadInstitutionsParams {
  page?: number;
  per_page?: number;
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
    page,
    per_page,
    routing_number,
    search_name,
  }: LoadInstitutionsParams) => {
    return configuredAxios
      .get("/institutions", {
        params: {
          page,
          pageSize: per_page,
          routingNumber: routing_number,
          search: search_name,
        },
      })
      .then((response) => response.data);
  },
};

export default connectWidgetApiService;
