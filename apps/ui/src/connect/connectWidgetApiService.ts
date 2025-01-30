import configuredAxios from "./axios";

export const RECOMMENDED_INSTITUTIONS_URL = "/institutions/recommended";

const connectWidgetApiService = {
  loadPopularInstitutions: async () => {
    return configuredAxios
      .get(RECOMMENDED_INSTITUTIONS_URL)
      .then((response) => response.data);
  },
};

export default connectWidgetApiService;
