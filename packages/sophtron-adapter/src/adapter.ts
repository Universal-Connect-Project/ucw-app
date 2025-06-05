import type {
  AggregatorInstitution,
  Challenge,
  Connection,
  CreateConnectionRequest,
  Credential,
  LogClient,
  UpdateConnectionRequest,
  WidgetAdapter,
} from "@repo/utils";
import {
  ChallengeType,
  ConnectionStatus,
  USER_NOT_RESOLVED_ERROR_TEXT,
} from "@repo/utils";

import type { AdapterConfig } from "./models";
import { SOPHTRON_ADAPTER_NAME } from "./constants";

import SophtronClientV1 from "./apiClient.v1";
import SophtronClient from "./apiClient.v2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromSophtronInstitution(ins: any): AggregatorInstitution | undefined {
  if (!ins) {
    return undefined;
  }
  return {
    id: ins.InstitutionID,
    aggregator: SOPHTRON_ADAPTER_NAME,
    supportsOauth: false,
  } as AggregatorInstitution;
}

export class SophtronAdapter implements WidgetAdapter {
  aggregator = SOPHTRON_ADAPTER_NAME;
  apiClient: SophtronClient;
  apiClientV1: SophtronClientV1;
  logClient: LogClient;
  envConfig: Record<string, string>;
  RouteHandlers = {};

  constructor(args: AdapterConfig) {
    const { dependencies } = args;

    this.logClient = dependencies.logClient;
    this.envConfig = dependencies.envConfig;
    this.apiClient = new SophtronClient(dependencies);
    this.apiClientV1 = new SophtronClientV1(dependencies);
  }

  async GetInstitutionById(id: string): Promise<AggregatorInstitution> {
    const ins = await this.apiClientV1.getInstitutionById(id);
    return fromSophtronInstitution(ins);
  }

  async ListInstitutionCredentials(id: string): Promise<Credential[]> {
    const ins = await this.apiClientV1.getInstitutionById(id);
    const ret = [
      {
        id: "username",
        label: ins?.InstitutionDetail?.LoginFormUserName ?? "User name",
        field_type: "LOGIN",
        field_name: "LOGIN",
      },
    ];
    if (ins?.InstitutionDetail?.LoginFormPassword !== "None") {
      ret.push({
        id: "password",
        label: ins?.InstitutionDetail?.LoginFormPassword ?? "Password",
        field_type: "PASSWORD",
        field_name: "PASSWORD",
      });
    }
    return ret;
  }

  async ListConnectionCredentials(
    connectionId: string,
    userId: string,
  ): Promise<Credential[]> {
    const uins = await this.apiClient.getMember(userId, connectionId);
    if (uins) {
      return await this.ListInstitutionCredentials(uins.InstitutionID);
    }
    return [];
  }

  async ListConnections(): Promise<Connection[]> {
    return [];
  }

  async CreateConnection(
    request: CreateConnectionRequest,
    userId: string,
  ): Promise<Connection | undefined> {
    const jobTypes = request.jobTypes;

    const username = request.credentials.find(
      (item) => item.id === "username",
    ).value;
    const passwordField = request.credentials.find(
      (item) => item.id === "password",
    );
    // if password field wasn't available, it should be a 'none' type
    const password = passwordField ? passwordField.value : "None";
    const ret = await this.apiClient.createMember(
      userId,
      jobTypes,
      username,
      password,
      request.institutionId,
    );
    if (ret) {
      return {
        id: ret.MemberID,
        cur_job_id: ret.JobID,
        institution_code: request.institutionId,
        status: ConnectionStatus.CREATED,
        aggregator: SOPHTRON_ADAPTER_NAME,
      };
    }
    return undefined;
  }

  async DeleteConnection(id: string, userId: string): Promise<void> {
    return this.apiClient.deleteMember(userId, id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async DeleteUser(aggregatorUserId: string): Promise<any> {
    return this.apiClient.deleteCustomer(aggregatorUserId);
  }

  async UpdateConnection(
    request: UpdateConnectionRequest,
    userId: string,
  ): Promise<Connection> {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const jobTypes = request.jobTypes;

    const username = request.credentials.find(
      (item) => item.id === "username",
    ).value;
    const password = request.credentials.find(
      (item) => item.id === "password",
    ).value;
    const ret = await this.apiClient.updateMember(
      userId,
      request.id,
      jobTypes,
      username,
      password,
    );
    return {
      id: ret.MemberID,
      cur_job_id: ret.JobID,
      institution_code: "institution_code", // TODO
      aggregator: SOPHTRON_ADAPTER_NAME,
    };
  }

  async GetConnectionById(
    connectionId: string,
    userId: string,
  ): Promise<Connection> {
    const m = await this.apiClient.getMember(userId, connectionId);
    return {
      id: m.MemberID,
      institution_code: m.InstitutionID,
      aggregator: SOPHTRON_ADAPTER_NAME,
      userId: userId,
    };
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async GetConnectionStatus(
    memberId: string,
    jobId: string,
    singleAccountSelect: boolean,
    userId: string,
  ): Promise<Connection> {
    if (!jobId) {
      const ret = await this.GetConnectionById(memberId, userId);
      return ret;
    }
    const job = await this.apiClient.getJobInfo(jobId);
    const challenge: Challenge = {
      id: "",
      type: ChallengeType.QUESTION,
    };
    let challenges = [challenge];
    let status = ConnectionStatus.CHALLENGED;
    let jobStatus = job.LastStatus;
    if (job.SuccessFlag === true) {
      jobStatus = "success";
    } else if (job.SuccessFlag === false) {
      jobStatus = "failed";
    }
    let sas_account = "";
    if (
      job.AccountID &&
      job.AccountID !== "00000000-0000-0000-0000-000000000000"
    ) {
      sas_account = job.AccountID;
    }
    switch (jobStatus) {
      case "success":
        // case 'Completed':
        status = ConnectionStatus.CONNECTED;
        break;
      case "failed":
        status = ConnectionStatus.FAILED;
        break;
      case "AccountsReady": {
        const jobType = job.JobType.toLowerCase();
        if (
          singleAccountSelect &&
          !sas_account &&
          (jobType.indexOf("verification") >= 0 ||
            jobType.indexOf("verify") >= 0)
        ) {
          const accounts =
            await this.apiClientV1.getUserInstitutionAccounts(memberId);
          challenge.id = "single_account_select";
          challenge.external_id = "single_account_select";
          challenge.type = ChallengeType.OPTIONS;
          challenge.question = "Please select an account to proceed:";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          challenge.data = accounts.map((a: any) => ({
            key: `${a.AccountName} ${a.AccountNumber}`,
            value: a.AccountID,
          }));
        } else {
          status = ConnectionStatus.CREATED;
        }
        break;
      }
      default:
        if (job.SecurityQuestion) {
          challenges = JSON.parse(job.SecurityQuestion).map( (q: string) => ({
            id: `SecurityQuestion`,
            type: ChallengeType.QUESTION,
            data: [{ key: q, value: q }]
          }))
          jobStatus = "SecurityQuestion";
        } else if (job.TokenMethod) {
          challenge.id = "TokenMethod";
          challenge.type = ChallengeType.OPTIONS;
          challenge.question =
            "Please select a channel to receive your secure code";
          challenge.data = JSON.parse(job.TokenMethod).map((q: string) => ({
            key: q,
            value: q,
          }));
          jobStatus = "TokenMethod";
        } else if (job.TokenSentFlag === true) {
          challenge.id = "TokenInput";
          challenge.type = ChallengeType.QUESTION;
          challenge.question = "ota";
          challenge.data = [
            {
              key: "ota",
              value: `Please enter the ${job.TokenInputName || "OTA code"}`,
            },
          ];
          jobStatus = "TokenInput";
        } else if (job.TokenRead) {
          challenge.id = "TokenRead";
          challenge.type = ChallengeType.OPTIONS;
          challenge.question = `Please approve from your secure device with following token: ${job.TokenRead}`;
          challenge.data = [
            {
              key: "Please complete verification and click here.",
              value: "token_read",
            },
          ];
          jobStatus = "TokenRead";
        } else if (job.CaptchaImage) {
          challenge.id = "CaptchaImage";
          challenge.type = ChallengeType.IMAGE;
          challenge.question = "Please enter the Captcha code";
          challenge.data = job.CaptchaImage;
          // TODO: select captcha, currently it's combined into one image and treated as a normal Captcha Image
          // challenge.type = ChallengeType.IMAGE_OPTION
          // challenge.label = ''
          jobStatus = "CaptchaImage";
        } else {
          status = ConnectionStatus.CREATED;
        }
        break;
    }

    const postMessageEventData = {
      rawStatus: jobStatus,
      selectedAccountId: sas_account,
      jobLastStep: job.LastStep,
      jobId: job.JobID,
    };

    return {
      id: job.UserInstitutionID,
      userId: userId,
      cur_job_id: job.JobID,
      postMessageEventData: {
        memberConnected: postMessageEventData,
        memberStatusUpdate: postMessageEventData,
      },
      status,
      challenges: challenges[0]?.id ? challenges : null,
      aggregator: SOPHTRON_ADAPTER_NAME,
    };
  }

  async AnswerChallenge(
    request: UpdateConnectionRequest,
    jobId: string,
  ): Promise<boolean> {
    const c = request.challenges[0];
    let answer;
    switch (c.id) {
      case "TokenRead":
        answer = true;
        break;
      case "SecurityQuestion":
        answer = JSON.stringify(request.challenges.map( ch => ch.response));
        break;
      case "TokenInput":
      case "single_account_select":
      case "TokenMethod":
      case "CaptchaImage":
        answer = c.response;
        break;
    }
    if (!answer) {
      this.logClient.error("Wrong challenge answer received", c);
      return false;
    }
    await this.apiClient.answerJobMfa(jobId, c.id, answer);
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  async ResolveUserId(userId: string, failIfNotFound: boolean = false) {
    this.logClient.debug("Resolving UserId: " + userId);
    const sophtronUser = await this.apiClient.getCustomerByUniqueName(userId);
    if (sophtronUser) {
      this.logClient.trace(
        `Found existing sophtron customer ${sophtronUser.CustomerID}`,
      );
      return sophtronUser.CustomerID;
    } else if (failIfNotFound) {
      throw new Error(USER_NOT_RESOLVED_ERROR_TEXT);
    }
    this.logClient.trace(`Creating sophtron user ${userId}`);
    const ret = await this.apiClient.createCustomer(userId);
    if (ret) {
      return ret.CustomerID;
    }
    this.logClient.trace(
      `Failed creating sophtron user, using userId: ${userId}`,
    );
    return userId;
  }
}
