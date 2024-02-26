const logger = require('../../infra/logger');
const http = require('../../infra/http');
const SophtronBaseClient = require('./base');

module.exports = class SophtronClient extends SophtronBaseClient {
  constructor (apiConfig) {
    super(apiConfig);
  }

  async getUserIntegrationKey () {
    const data = { Id: this.apiConfig.clientId };
    const ret = await this.post('/User/GetUserIntegrationKey', data);
    return ret;
  }

  async getUserInstitutionById (id) {
    return await this.post('/UserInstitution/GetUserInstitutionByID', {
      UserInstitutionID: id
    });
  }

  // getUserInstitutionsByUser(id) {
  //   return this.post('/UserInstitution/GetUserInstitutionsByUser', { UserID: id });
  // }
  async deleteUserInstitution (id) {
    return await this.post('/UserInstitution/DeleteUserInstitution', {
      UserInstitutionID: id
    });
  }

  async getUserInstitutionAccounts (userInstitutionID) {
    return await this.post('/UserInstitution/GetUserInstitutionAccounts', {
      UserInstitutionID: userInstitutionID
    });
  }

  async getInstitutionById (id) {
    const data = { InstitutionID: id };
    return await this.post('/Institution/GetInstitutionByID', data);
  }

  async getInstitutionByRoutingNumber (number) {
    return await this.post('/Institution/GetInstitutionByRoutingNumber', {
      RoutingNumber: number
    });
  }

  async getInstitutionsByName (name) {
    // console.log(name);
    if ((name || '').length > 0) {
      const data = await this.post('/Institution/GetInstitutionByName', {
        InstitutionName: name,
        Extensive: true,
        InstitutionType: 'All'
      });
      if (data?.length > 0) {
        return data
          .sort((a, b) => a.InstitutionName.length - b.InstitutionName.length)
          .slice(0, 9);
      }
      return data;
    }
    return [];
  }

  async getJob (id) {
    return await this.post('/Job/GetJobInformationByID', { JobID: id });
  }

  async jobSecurityAnswer (jobId, answer) {
    const ret = await this.post('/Job/UpdateJobSecurityAnswer', {
      JobID: jobId,
      SecurityAnswer: JSON.stringify(answer)
    });
    return ret === 0 ? {} : { error: 'SecurityAnswer failed' };
  }

  async jobTokenInput (jobId, tokenChoice, tokenInput, verifyPhoneFlag) {
    const ret = await this.post('/Job/UpdateJobTokenInput', {
      JobID: jobId,
      TokenChoice: tokenChoice,
      TokenInput: tokenInput,
      VerifyPhoneFlag: verifyPhoneFlag
    });
    return ret === 0 ? {} : { error: 'TokenInput failed' };
  }

  async jobCaptchaInput (jobId, input) {
    const ret = await this.post('/Job/UpdateJobCaptchaInput', {
      JobID: jobId,
      CaptchaInput: input
    });
    return ret === 0 ? {} : { error: 'Captcha failed' };
  }

  async createUserInstitutionWithRefresh (username, password, institutionId) {
    const url = '/UserInstitution/CreateUserInstitutionWithRefresh';
    const data = {
      UserName: username,
      Password: password,
      InstitutionID: institutionId,
      UserID: this.apiConfig.clientId
    };
    return await this.post(url, data);
  }

  async createUserInstitutionWithProfileInfo (username, password, institutionId) {
    const url = '/UserInstitution/CreateUserInstitutionWithProfileInfo';
    const data = {
      UserName: username,
      Password: password,
      InstitutionID: institutionId,
      UserID: this.apiConfig.clientId
    };
    return await this.post(url, data);
  }

  async createUserInstitutionWithAllPlusProfile (username, password, institutionId) {
    const url = '/UserInstitution/CreateUserInstitutionWithAllPlusProfile';
    const data = {
      UserName: username,
      Password: password,
      InstitutionID: institutionId,
      UserID: this.apiConfig.clientId
    };
    return await this.post(url, data);
  }

  async createUserInstitutionWithFullHistory (username, password, institutionId) {
    const url = '/UserInstitution/CreateUserInstitutionWithFullHistory';
    const data = {
      UserName: username,
      Password: password,
      InstitutionID: institutionId,
      UserID: this.apiConfig.clientId
    };
    return await this.post(url, data);
  }

  async createUserInstitutionWithFullAccountNumbers (
    username,
    password,
    institutionId
  ) {
    const url = '/UserInstitution/CreateUserInstitutionWithFullAccountNumbers';
    const data = {
      UserName: username,
      Password: password,
      InstitutionID: institutionId,
      UserID: this.apiConfig.clientId
    };
    return await this.post(url, data);
  }

  async createUserInstitutionWOJob (username, password, institutionId) {
    const url = '/UserInstitution/CreateUserInstitutionWOJob';
    return await this.post(url, {
      UserName: username,
      Password: password,
      InstitutionID: institutionId
    });
  }

  async updateUserInstitution (username, password, userInstitutionID) {
    const url = '/UserInstitution/UpdateUserInstitution';
    return await this.post(url, {
      UserName: username,
      Password: password,
      UserInstitutionID: userInstitutionID
    });
  }

  async getUserInstitutionProfileInfor (userInstitutionID) {
    const url = '/UserInstitution/GetUserInstitutionProfileInfor';
    return await this.post(url, { UserInstitutionID: userInstitutionID }).then((data) => {
      data.UserInstitutionID = userInstitutionID;
      return data;
    });
  }

  async refreshUserInstitution (userInstitutionID) {
    const url = '/UserInstitution/RefreshUserInstitution';
    return await this.post(url, { UserInstitutionID: userInstitutionID }).then((data) => {
      data.UserInstitutionID = userInstitutionID;
      return data;
    });
  }

  async getFullAccountNumberWithinJob (accountId, jobId) {
    const url = '/UserInstitutionAccount/GetFullAccountNumberWithinJob';
    return await this.post(url, { AccountID: accountId, JobID: jobId });
  }

  ping = () => {
    return http.get(
      `${this.apiConfig.endpoint}/UserInstitution/Ping`
    );
  };
};
