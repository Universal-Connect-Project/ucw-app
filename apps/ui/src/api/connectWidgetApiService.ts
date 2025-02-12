import configuredAxios from "./axios";
import {
  RECOMMENDED_INSTITUTIONS_URL,
  SEARCH_INSTITUTIONS_URL,
} from "@repo/utils";

interface LoadInstitutionsParams {
  page?: number;
  per_page?: number;
  routing_number?: number;
  search_name?: string;
}

const connectWidgetApiService = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addMember: async (memberData: any) => {
    return configuredAxios
      .post(`members`, memberData)
      .then((response) => response.data);
  },
  getInstitutionCredentials: async (guid: string) => {
    return configuredAxios
      .get(`/institutions/${guid}/credentials`)
      .then((response) => response.data);
  },
  loadInstitutionByGuid: async (guid: string) => {
    return configuredAxios
      .get(`/institutions/${guid}`)
      .then((response) => response.data);
  },
  loadInstitutions: async ({
    page,
    per_page,
    routing_number,
    search_name,
  }: LoadInstitutionsParams) => {
    return configuredAxios
      .get(SEARCH_INSTITUTIONS_URL, {
        params: {
          page,
          pageSize: per_page,
          routingNumber: routing_number,
          search: search_name,
        },
      })
      .then((response) => response.data);
  },
  loadJob: async (jobGuid: string) => {
    return configuredAxios
      .get(`/jobs/${jobGuid}`)
      .then((response) => response.data);
  },
  loadMemberByGuid: async (memberGuid: string) => {
    return configuredAxios
      .get(`/members/${memberGuid}`)
      .then((response) => response.data);
  },
  loadPopularInstitutions: async () => {
    return configuredAxios
      .get(RECOMMENDED_INSTITUTIONS_URL)
      .then((response) => response.data);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateMFA: async (memberData: any) => {
    return configuredAxios.put(`/members/${memberData.id}`);
  },
};

export default connectWidgetApiService;
