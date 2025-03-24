import { ChallengeType, ComboJobTypes, ConnectionStatus } from "@repo/utils";
import { http, HttpResponse } from "msw";

import { MxAdapter } from "./adapter";

import {
  ANSWER_CHALLENGE_PATH,
  CREATE_MEMBER_PATH,
  CREATE_USER_PATH,
  DELETE_CONNECTION_PATH,
  DELETE_MEMBER_PATH,
  MX_DELETE_USER_PATH,
  MX_INSTITUTION_BY_ID_PATH,
  READ_MEMBER_STATUS_PATH,
  UPDATE_CONNECTION_PATH,
} from "./test/handlers";
import { institutionData } from "./test/testData/institution";
import { institutionCredentialsData } from "./test/testData/institutionCredentials";
import { aggregatorCredentials } from "./test/testData/aggregatorCredentials";
import {
  connectionByIdMemberData,
  memberData,
  membersData,
  memberStatusData,
} from "./test/testData/members";
import { createUserData, listUsersData } from "./test/testData/users";
import { server } from "./test/testServer";

import { createClient as createCacheClient } from "./test/utils/cacheClient";
import { logClient } from "./test/utils/logClient";

const cacheClient = createCacheClient();

const HOSTURL = "test";

const mxAdapterInt = new MxAdapter({
  int: true,
  dependencies: {
    cacheClient,
    logClient,
    aggregatorCredentials,
    envConfig: {
      HOSTURL,
    },
  },
});

const mxAdapter = new MxAdapter({
  int: false,
  dependencies: {
    cacheClient,
    logClient,
    aggregatorCredentials,
    envConfig: {
      HOSTURL,
    },
  },
});

const institutionResponse = institutionData.institution;
const clientRedirectUrl = `${HOSTURL}/oauth/mx/redirect_from/`;

const testCredential = {
  id: "testCredentialId",
  label: "testCredentialLabel",
  value: "testCredentialValue",
  field_type: "testCredentialFieldType",
  field_name: "testCredentialFieldName",
};

const testChallenge = {
  id: "testChallengeId",
  external_id: "testExternalId",
  question: "testQuestion",
  data: "testData",
  type: ChallengeType.QUESTION,
  response: "testResponse",
};

describe("mx aggregator", () => {
  describe("MxAdapter", () => {
    it("works with integration credentials", async () => {
      expect(await mxAdapterInt.GetInstitutionById("testId")).toEqual({
        id: institutionResponse.code,
        logo_url: institutionResponse.medium_logo_url,
        name: institutionResponse.name,
        oauth: institutionResponse.supports_oauth,
        url: institutionResponse.url,
        aggregator: "mx_int",
      });
    });

    describe("GetInsitutionById", () => {
      it("uses the medium logo if available", async () => {
        expect(await mxAdapter.GetInstitutionById("testId")).toEqual({
          id: institutionResponse.code,
          logo_url: institutionResponse.medium_logo_url,
          name: institutionResponse.name,
          oauth: institutionResponse.supports_oauth,
          url: institutionResponse.url,
          aggregator: "mx",
        });
      });

      it("uses the small logo if no medium logo", async () => {
        server.use(
          http.get(MX_INSTITUTION_BY_ID_PATH, () =>
            HttpResponse.json({
              ...institutionData,
              institution: {
                ...institutionData.institution,
                medium_logo_url: undefined,
              },
            }),
          ),
        );

        expect(await mxAdapter.GetInstitutionById("testId")).toEqual({
          id: institutionResponse.code,
          logo_url: institutionResponse.small_logo_url,
          name: institutionResponse.name,
          oauth: institutionResponse.supports_oauth,
          url: institutionResponse.url,
          aggregator: "mx",
        });
      });
    });

    describe("ListInstitutionCredentials", () => {
      const [firstCredential, secondCredential] =
        institutionCredentialsData.credentials;

      it("transforms the credentials into useable form", async () => {
        expect(await mxAdapter.ListInstitutionCredentials("testId")).toEqual([
          {
            id: firstCredential.guid,
            field_name: firstCredential.field_name,
            field_type: firstCredential.field_type,
            label: firstCredential.label,
          },
          {
            id: secondCredential.guid,
            field_name: secondCredential.field_name,
            field_type: secondCredential.field_type,
            label: secondCredential.label,
          },
        ]);
      });
    });

    describe("ListConnections", () => {
      const [firstMember, secondMember] = membersData.members;

      it("retrieves and transforms the members", async () => {
        expect(await mxAdapter.ListConnections("testId")).toEqual([
          {
            id: firstMember.guid,
            cur_job_id: firstMember.guid,
            institution_code: firstMember.institution_code,
            is_being_aggregated: firstMember.is_being_aggregated,
            is_oauth: firstMember.is_oauth,
            oauth_window_uri: firstMember.oauth_window_uri,
            aggregator: "mx",
          },
          {
            id: secondMember.guid,
            cur_job_id: secondMember.guid,
            institution_code: secondMember.institution_code,
            is_being_aggregated: secondMember.is_being_aggregated,
            is_oauth: secondMember.is_oauth,
            oauth_window_uri: secondMember.oauth_window_uri,
            aggregator: "mx",
          },
        ]);
      });
    });

    describe("ListConnectionCredentials", () => {
      const [firstCredential, secondCredential] =
        institutionCredentialsData.credentials;

      it("retreieves and transforms member credentials", async () => {
        expect(
          await mxAdapter.ListConnectionCredentials(
            "testMemberId",
            "testUserId",
          ),
        ).toEqual([
          {
            id: firstCredential.guid,
            field_name: firstCredential.field_name,
            field_type: firstCredential.field_type,
            label: firstCredential.label,
          },
          {
            id: secondCredential.guid,
            field_name: secondCredential.field_name,
            field_type: secondCredential.field_type,
            label: secondCredential.label,
          },
        ]);
      });
    });

    describe("CreateConnection", () => {
      const baseConnectionRequest = {
        id: "testId",
        initial_job_type: "verification",
        background_aggregation_is_disabled: false,
        credentials: [testCredential],
        jobTypes: [ComboJobTypes.TRANSACTIONS, ComboJobTypes.ACCOUNT_NUMBER],
        institutionId: "testInstitutionId",
        is_oauth: false,
        skip_aggregation: false,
        metadata: "testMetadata",
      };

      it("deletes the existing member if one is found", async () => {
        let memberDeletionAttempted = false;

        server.use(
          http.delete(DELETE_MEMBER_PATH, () => {
            memberDeletionAttempted = true;

            return new HttpResponse(null, {
              status: 200,
            });
          }),
        );

        await mxAdapter.CreateConnection(
          {
            ...baseConnectionRequest,
            institutionId: membersData.members[0].institution_code,
            is_oauth: true,
          },
          "testUserId",
        );

        expect(memberDeletionAttempted).toBe(true);
      });

      describe("createMemberPayload spy tests", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let createMemberPayload: any;

        beforeEach(() => {
          createMemberPayload = null;

          server.use(
            http.post(CREATE_MEMBER_PATH, async ({ request }) => {
              createMemberPayload = await request.json();

              return HttpResponse.json(memberData);
            }),
          );
        });

        it("creates member with a client_redirect_url if is_oauth", async () => {
          await mxAdapter.CreateConnection(
            {
              ...baseConnectionRequest,
              is_oauth: true,
            },
            "testUserId",
          );

          expect(createMemberPayload.client_redirect_url).toEqual(
            clientRedirectUrl,
          );
        });

        it("creates member without a client_redirect_url if !is_oauth", async () => {
          await mxAdapter.CreateConnection(
            {
              ...baseConnectionRequest,
              is_oauth: false,
            },
            "testUserId",
          );

          expect(createMemberPayload.client_redirect_url).toEqual(null);
        });

        it("creates a member with correctly mapped request options and returns the member from that response when is_oauth", async () => {
          await mxAdapter.CreateConnection(
            {
              ...baseConnectionRequest,
              is_oauth: true,
            },
            "testUserId",
          );

          expect(createMemberPayload).toEqual({
            client_redirect_url: clientRedirectUrl,
            member: {
              credentials: [
                {
                  guid: baseConnectionRequest.credentials[0].id,
                  value: baseConnectionRequest.credentials[0].value,
                },
              ],
              institution_code: baseConnectionRequest.institutionId,
              is_oauth: true,
            },
            data_request: {
              products: ["transactions", "account_verification"],
            },
            referral_source: "APP",
          });
        });
      });
    });

    describe("DeleteConnection", () => {
      it("deletes the connection", async () => {
        let connectionDeletionAttempted = false;

        server.use(
          http.delete(DELETE_CONNECTION_PATH, () => {
            connectionDeletionAttempted = true;

            return new HttpResponse(null, {
              status: 200,
            });
          }),
        );

        await mxAdapter.DeleteConnection("testId", "testUserId");

        expect(connectionDeletionAttempted).toBe(true);
      });
    });

    describe("DeleteUser", () => {
      it("deletes the user", async () => {
        let userDeletionAttempted = false;

        server.use(
          http.delete(MX_DELETE_USER_PATH, () => {
            userDeletionAttempted = true;

            return new HttpResponse(null, {
              status: 204,
            });
          }),
        );

        await mxAdapter.DeleteUser("testUserId");

        expect(userDeletionAttempted).toBe(true);
      });
    });

    describe("UpdateConnection", () => {
      it("it calls updateMember with the correct request body and returns the member", async () => {
        let updateConnectionPaylod;

        server.use(
          http.put(UPDATE_CONNECTION_PATH, async ({ request }) => {
            updateConnectionPaylod = await request.json();

            return HttpResponse.json(memberData);
          }),
        );

        const member = await mxAdapter.UpdateConnection(
          {
            id: "updateConnectionId",
            job_type: "testJobType",
            credentials: [testCredential],
            challenges: [testChallenge],
          },
          "testUserId",
        );

        expect(updateConnectionPaylod).toEqual({
          member: {
            credentials: [
              {
                guid: testCredential.id,
                value: testCredential.value,
              },
            ],
          },
        });

        const testMember = memberData.member;

        expect(member).toEqual({
          cur_job_id: testMember.guid,
          id: testMember.guid,
          institution_code: testMember.institution_code,
          is_being_aggregated: testMember.is_being_aggregated,
          is_oauth: testMember.is_oauth,
          oauth_window_uri: testMember.oauth_window_uri,
          aggregator: "mx",
        });
      });
    });

    describe("GetConnectionById", () => {
      it("returns the member from readMember", async () => {
        const testUserId = "userId";
        const member = await mxAdapter.GetConnectionById(
          "connectionId",
          testUserId,
        );

        const testMember = connectionByIdMemberData.member;

        expect(member).toEqual({
          id: testMember.guid,
          institution_code: testMember.institution_code,
          is_being_aggregated: testMember.is_being_aggregated,
          is_oauth: testMember.is_oauth,
          oauth_window_uri: testMember.oauth_window_uri,
          aggregator: "mx",
          userId: testUserId,
        });
      });
    });

    describe("GetConnectionStatus", () => {
      it("returns a rejected connection status if there's an error with oauthStatus", async () => {
        await cacheClient.set(memberStatusData.member.guid, { error: true });

        const connectionStatus = await mxAdapter.GetConnectionStatus(
          "testMemberId",
          "testJobId",
          false,
          "testUserId",
        );

        expect(connectionStatus.status).toEqual(ConnectionStatus.REJECTED);
      });

      it("returns a properly mapped response with TEXT, OPTIONS< TOKEN< IMAGE_DATA, and IMAGE_OPTIONS challenges", async () => {
        const challenges = [
          {
            guid: "challengeGuid1",
            label: "challengeLabel1",
            type: "TEXT",
          },
          {
            guid: "challengeGuid2",
            label: "challengeLabel2",
            options: [
              {
                label: "optionLabel1",
                value: "optionValue1",
              },
            ],
            type: "OPTIONS",
          },
          {
            guid: "challengeGuid3",
            label: "challengeLabel3",
            type: "TOKEN",
          },
          {
            guid: "challengeGuid4",
            label: "challengeLabel4",
            image_data: "imageData",
            type: "IMAGE_DATA",
          },
          {
            guid: "challengeGuid5",
            image_options: [
              {
                label: "optionLabel1",
                value: "optionValue1",
              },
            ],
            label: "challengeLabel5",
            type: "IMAGE_OPTIONS",
          },
        ];

        const [
          textChallenge,
          optionsChallenge,
          tokenChallenge,
          imageChallenge,
          imageOptionsChallenge,
        ] = challenges;

        server.use(
          http.get(READ_MEMBER_STATUS_PATH, () =>
            HttpResponse.json({
              ...memberStatusData,
              member: {
                ...memberStatusData.member,
                challenges,
              },
            }),
          ),
        );

        const testMember = memberStatusData.member;
        const userId = "testUserId";

        expect(
          await mxAdapter.GetConnectionStatus(
            "testMemberId",
            "testJobId",
            false,
            userId,
          ),
        ).toEqual({
          cur_job_id: testMember.guid,
          aggregator: "mx",
          id: testMember.guid,
          userId: userId,
          status:
            ConnectionStatus[
              testMember.connection_status as keyof typeof ConnectionStatus
            ],
          challenges: [
            {
              data: [
                {
                  key: "0",
                  value: textChallenge.label,
                },
              ],
              id: textChallenge.guid,
              type: ChallengeType.QUESTION,
              question: textChallenge.label,
            },
            {
              data: [
                {
                  key: optionsChallenge.options
                    ? optionsChallenge.options[0].label
                    : "",
                  value: optionsChallenge.options
                    ? optionsChallenge.options[0].value
                    : "",
                },
              ],
              id: optionsChallenge.guid,
              question: optionsChallenge.label,
              type: ChallengeType.OPTIONS,
            },
            {
              id: tokenChallenge.guid,
              data: tokenChallenge.label,
              question: tokenChallenge.label,
              type: ChallengeType.TOKEN,
            },
            {
              data: imageChallenge.image_data,
              id: imageChallenge.guid,
              question: imageChallenge.label,
              type: ChallengeType.IMAGE,
            },
            {
              data: [
                {
                  key: imageOptionsChallenge.image_options
                    ? imageOptionsChallenge.image_options[0].label
                    : "",
                  value: imageOptionsChallenge.image_options
                    ? imageOptionsChallenge.image_options[0].value
                    : "",
                },
              ],
              id: imageOptionsChallenge.guid,
              question: imageOptionsChallenge.label,
              type: ChallengeType.IMAGE_OPTIONS,
            },
          ],
        });
      });
    });

    describe("AnswerChallenge", () => {
      it("calls the resumeAggregation endpoint with the correct payload and returns true", async () => {
        let answerChallengePayload;

        server.use(
          http.put(ANSWER_CHALLENGE_PATH, async ({ request }) => {
            answerChallengePayload = await request.json();

            return new HttpResponse(null, { status: 200 });
          }),
        );

        const challenge = {
          id: "challengeId",
          response: "challengeResponse",
        };

        expect(
          await mxAdapter.AnswerChallenge(
            {
              id: "requestId",
              job_type: "auth",
              credentials: [],
              challenges: [challenge],
            },
            "jobId",
            "userId",
          ),
        );

        expect(answerChallengePayload).toEqual({
          member: {
            challenges: [
              {
                guid: challenge.id,
                value: challenge.response,
              },
            ],
          },
        });
      });
    });

    describe("ResolveUserId", () => {
      it("returns the mx user from listUsers if it's available", async () => {
        const user = listUsersData.users[0];

        const returnedUserId = await mxAdapter.ResolveUserId(user.id);

        expect(returnedUserId).toEqual(user.guid);
      });

      it("creates the user if the user isn't in the list and returns it from there", async () => {
        const returnedUserId = await mxAdapter.ResolveUserId(
          "userIdNotInListUsers",
        );

        expect(returnedUserId).toEqual(createUserData.user.guid);
      });

      it("returns the provided userId if creating a user fails", async () => {
        server.use(
          http.post(
            CREATE_USER_PATH,
            () => new HttpResponse(null, { status: 400 }),
          ),
        );

        const userId = "userIdNotInListUsers";

        const returnedUserId = await mxAdapter.ResolveUserId(userId);

        expect(returnedUserId).toEqual(userId);
      });

      it("throws an error if customer does not exist and failIfNotFound is true", async () => {
        const userId = "userIdNotInListUsers";

        await expect(
          async () => await mxAdapter.ResolveUserId(userId, true),
        ).rejects.toThrow("User not resolved successfully");
      });
    });

    describe("HandleOauthResponse", () => {
      it("responds with success if the status is success", async () => {
        const ret = await mxAdapter.HandleOauthResponse({
          query: {
            status: "success",
          },
        });

        expect(ret).toEqual({
          status: ConnectionStatus.CONNECTED,
        });
      });

      it("returns with denied if the status is not success", async () => {
        const ret = await mxAdapter.HandleOauthResponse({
          query: {},
        });
        expect(ret).toEqual({
          status: ConnectionStatus.DENIED,
        });
      });
    });
  });
});
