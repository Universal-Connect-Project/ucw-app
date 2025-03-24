import { ComboJobTypes } from "@repo/utils";
import SophtronBaseClient from "./apiClient.base";

const SophtronJobTypeMap = {
  [ComboJobTypes.ACCOUNT_NUMBER]: "verification",
  [ComboJobTypes.ACCOUNT_OWNER]: "identity",
  [ComboJobTypes.TRANSACTIONS]: "aggregate",
  [ComboJobTypes.TRANSACTION_HISTORY]: "history",
};

const convertToSophtronJobTypes = (jobTypes: ComboJobTypes[]) =>
  jobTypes
    .map((jobType: ComboJobTypes) => SophtronJobTypeMap[jobType])
    .join("|");

export default class SophtronV2Client extends SophtronBaseClient {
  async getCustomer(customerId: string) {
    return await this.get(`/v2/customers/${customerId}`);
  }

  async getCustomerByUniqueName(uniqueName: string) {
    const arr = await this.get(`/v2/customers?uniqueID=${uniqueName}`);
    return arr?.[0];
  }

  async createCustomer(uniqueName: string) {
    return await this.post("/v2/customers", {
      UniqueID: uniqueName,
      Source: `Universal_Widget_${this.envConfig.HOSTURL}`,
      Name: "UniversalWidget_Customer",
    });
  }

  async deleteCustomer(customerId: string) {
    return await this.del(`/v2/customers/${customerId}`);
  }

  async getMember(customerId: string, memberId: string) {
    return await this.get(`/v2/customers/${customerId}/members/${memberId}`);
  }

  async createMember(
    customerId: string,
    jobTypes: ComboJobTypes[],
    username: string,
    password: string,
    institutionId: string,
  ) {
    return await this.post(
      `/v2/customers/${customerId}/members/${convertToSophtronJobTypes(jobTypes)}`,
      {
        UserName: username,
        Password: password,
        InstitutionID: institutionId,
      },
    );
  }

  async updateMember(
    customerId: string,
    memberId: string,
    jobTypes: ComboJobTypes[],
    username: string,
    password: string,
  ) {
    return await this.put(
      `/v2/customers/${customerId}/members/${memberId}/${convertToSophtronJobTypes(jobTypes)}`,
      {
        UserName: username,
        Password: password,
      },
    );
  }

  async deleteMember(customerId: string, memberId: string) {
    return await this.del(`/v2/customers/${customerId}/members/${memberId}`);
  }

  async getJobInfo(jobId: string) {
    return await this.get(`/v2/job/${jobId}`);
  }

  async answerJobMfa(jobId: string, mfaType: any, answer: any) {
    return await this.put(`/v2/job/${jobId}/challenge/${mfaType}`, {
      AnswerText: answer,
    });
  }
}
