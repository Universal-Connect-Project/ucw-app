import { apiEndpoint } from "./consts";
import SophtronBaseClient from "./apiClient.base";

export default class SophtronClient extends SophtronBaseClient {
  async getUserIntegrationKey() {
    const data = { Id: this.apiConfig.clientId };
    return await this.post("/User/GetUserIntegrationKey", data);
  }

  async getUserInstitutionById(id: string) {
    return await this.post("/UserInstitution/GetUserInstitutionByID", {
      UserInstitutionID: id,
    });
  }

  // getUserInstitutionsByUser(id: string) {
  //   return this.post('/UserInstitution/GetUserInstitutionsByUser', { UserID: id });
  // }
  async deleteUserInstitution(id: string) {
    return await this.post("/UserInstitution/DeleteUserInstitution", {
      UserInstitutionID: id,
    });
  }

  async getUserInstitutionAccounts(userInstitutionID: string) {
    return await this.post("/UserInstitution/GetUserInstitutionAccounts", {
      UserInstitutionID: userInstitutionID,
    });
  }

  async getInstitutionById(id: string) {
    const data = { InstitutionID: id };
    return await this.post("/Institution/GetInstitutionByID", data);
  }

  async getInstitutionByRoutingNumber(number: string) {
    return await this.post("/Institution/GetInstitutionByRoutingNumber", {
      RoutingNumber: number,
    });
  }

  async getJob(id: string) {
    return await this.post("/Job/GetJobInformationByID", { JobID: id });
  }

  async jobSecurityAnswer(jobId: string, answer: string) {
    const ret = await this.post("/Job/UpdateJobSecurityAnswer", {
      JobID: jobId,
      SecurityAnswer: JSON.stringify(answer),
    });
    return ret === 0 ? {} : { error: "SecurityAnswer failed" };
  }

  async jobTokenInput(
    jobId: string,
    tokenChoice: string,
    tokenInput: string,
    verifyPhoneFlag: boolean,
  ) {
    const ret = await this.post("/Job/UpdateJobTokenInput", {
      JobID: jobId,
      TokenChoice: tokenChoice,
      TokenInput: tokenInput,
      VerifyPhoneFlag: verifyPhoneFlag,
    });
    return ret === 0 ? {} : { error: "TokenInput failed" };
  }

  async jobCaptchaInput(jobId: string, input: string) {
    const ret = await this.post("/Job/UpdateJobCaptchaInput", {
      JobID: jobId,
      CaptchaInput: input,
    });
    return ret === 0 ? {} : { error: "Captcha failed" };
  }

  async createUserInstitutionWithRefresh(
    username: string,
    password: string,
    institutionId: string,
  ) {
    const url = "/UserInstitution/CreateUserInstitutionWithRefresh";
    const data = {
      UserName: username,
      Password: password,
      InstitutionID: institutionId,
      UserID: this.apiConfig.clientId,
    };
    return await this.post(url, data);
  }

  async createUserInstitutionWithProfileInfo(
    username: string,
    password: string,
    institutionId: string,
  ) {
    const url = "/UserInstitution/CreateUserInstitutionWithProfileInfo";
    const data = {
      UserName: username,
      Password: password,
      InstitutionID: institutionId,
      UserID: this.apiConfig.clientId,
    };
    return await this.post(url, data);
  }

  async createUserInstitutionWithAllPlusProfile(
    username: string,
    password: string,
    institutionId: string,
  ) {
    const url = "/UserInstitution/CreateUserInstitutionWithAllPlusProfile";
    const data = {
      UserName: username,
      Password: password,
      InstitutionID: institutionId,
      UserID: this.apiConfig.clientId,
    };
    return await this.post(url, data);
  }

  async createUserInstitutionWithFullHistory(
    username: string,
    password: string,
    institutionId: string,
  ) {
    const url = "/UserInstitution/CreateUserInstitutionWithFullHistory";
    const data = {
      UserName: username,
      Password: password,
      InstitutionID: institutionId,
      UserID: this.apiConfig.clientId,
    };
    return await this.post(url, data);
  }

  async createUserInstitutionWithFullAccountNumbers(
    username: string,
    password: string,
    institutionId: string,
  ) {
    const url = "/UserInstitution/CreateUserInstitutionWithFullAccountNumbers";
    const data = {
      UserName: username,
      Password: password,
      InstitutionID: institutionId,
      UserID: this.apiConfig.clientId,
    };
    return await this.post(url, data);
  }

  async createUserInstitutionWOJob(
    username: string,
    password: string,
    institutionId: string,
  ) {
    const url = "/UserInstitution/CreateUserInstitutionWOJob";
    return await this.post(url, {
      UserName: username,
      Password: password,
      InstitutionID: institutionId,
    });
  }

  async updateUserInstitution(
    username: string,
    password: string,
    userInstitutionID: string,
  ) {
    const url = "/UserInstitution/UpdateUserInstitution";
    return await this.post(url, {
      UserName: username,
      Password: password,
      UserInstitutionID: userInstitutionID,
    });
  }

  async getUserInstitutionProfileInfor(userInstitutionID: string) {
    const url = "/UserInstitution/GetUserInstitutionProfileInfor";
    return await this.post(url, { UserInstitutionID: userInstitutionID }).then(
      (data) => {
        data.UserInstitutionID = userInstitutionID;
        return data;
      },
    );
  }

  async refreshUserInstitution(userInstitutionID: string) {
    const url = "/UserInstitution/RefreshUserInstitution";
    return await this.post(url, { UserInstitutionID: userInstitutionID }).then(
      (data) => {
        data.UserInstitutionID = userInstitutionID;
        return data;
      },
    );
  }

  async getFullAccountNumberWithinJob(accountId: string, jobId: string) {
    const url = "/UserInstitutionAccount/GetFullAccountNumberWithinJob";
    return await this.post(url, { AccountID: accountId, JobID: jobId });
  }

  ping = async () => {
    return await this.get(`${apiEndpoint}/UserInstitution/Ping`);
  };
}
