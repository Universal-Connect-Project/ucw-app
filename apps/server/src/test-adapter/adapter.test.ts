import { ConnectionStatus } from "@repo/utils";
import he from "he";
import { TestAdapter } from "./adapter";
import {
  testDataRequestValidators,
  testDataRequestValidatorStartTimeError,
  testExampleInstitution,
  testExampleJobResponse,
  testRouteHandlers,
} from "./constants";
import { MappedJobTypes } from "../shared/contract";
import { get, set } from "../services/storageClient/redis";

const labelText = "testLabelText";
const aggregator = "aggregator";

const testAdapterA = new TestAdapter({
  labelText,
  aggregator,
});

const testAdapterB = new TestAdapter({
  labelText,
  aggregator,
  routeHandlers: testRouteHandlers,
  dataRequestValidators: testDataRequestValidators,
});

const successConnectionStatus = {
  aggregator,
  id: "testId",
  cur_job_id: "testJobId",
  user_id: "userId",
  status: ConnectionStatus.CONNECTED,
  challenges: [],
} as any;

describe("TestAdapter", () => {
  describe("RouteHandlers", () => {
    it("returns an empty object of RouteHandlers functions when there are no handlers", async () => {
      const handlers: Record<string, (req: any, res: any) => void> =
        testAdapterA.RouteHandlers;
      expect(Object.keys(handlers)).toHaveLength(0);
    });

    it("returns an object of RouteHandlers functions when there are handlers", async () => {
      const handlers: Record<string, (req: any, res: any) => void> =
        testAdapterB.RouteHandlers;
      expect(Object.keys(handlers)).toHaveLength(1);
    });

    describe("jobRequestHandler", () => {
      it("returns data when calling jobRequestHandler", async () => {
        const res = {
          send: jest.fn(),
        };

        testAdapterB.RouteHandlers.jobRequestHandler(undefined, res);
        expect(res.send).toHaveBeenCalledWith(testExampleJobResponse);
      });
    });
  });

  describe("DataRequestValidators", () => {
    it("returns an empty object when there are no validators", async () => {
      const handlers: Record<string, (req: any, res: any) => void> =
        testAdapterA.DataRequestValidators;
      expect(Object.keys(handlers)).toHaveLength(0);
    });

    it("returns an object of functions when there are validators", async () => {
      const handlers: Record<string, (req: any, res: any) => void> =
        testAdapterB.DataRequestValidators;
      expect(Object.keys(handlers)).toHaveLength(1);
    });

    describe("dataRequestValidator", () => {
      it("fails if there is a custom validator and start_time is missing", async () => {
        const req = {
          query: {
            start_time: "",
          },
        };

        const validationResponse =
          testAdapterB.DataRequestValidators.transactions(req);
        expect(validationResponse).toEqual(
          testDataRequestValidatorStartTimeError,
        );
      });
    });
  });

  describe("GetInstitutionById", () => {
    it("returns a response object", async () => {
      expect(await testAdapterA.GetInstitutionById("test")).toEqual({
        id: "test",
        logo_url: testExampleInstitution.logo_url,
        name: testExampleInstitution.name,
        oauth: testExampleInstitution.oauth,
        aggregator,
        url: testExampleInstitution.url,
      });
    });
  });

  describe("ListInstitutionCredentials", () => {
    it("returns a response object", async () => {
      expect(await testAdapterA.ListInstitutionCredentials("test")).toEqual([
        {
          field_name: "fieldName",
          field_type: "fieldType",
          id: "testId",
          label: labelText,
        },
      ]);
    });
  });

  describe("ListConnections", () => {
    it("returns a response object", async () => {
      expect(await testAdapterA.ListConnections("test")).toEqual([
        {
          id: "testId",
          cur_job_id: "testJobId",
          institution_code: "testCode",
          is_being_aggregated: false,
          is_oauth: false,
          oauth_window_uri: undefined,
          aggregator,
        },
      ]);
    });
  });

  describe("ListConnectionCredentials", () => {
    it("returns a response object", async () => {
      expect(
        await testAdapterA.ListConnectionCredentials("test", "test"),
      ).toEqual([
        {
          id: "testId",
          field_name: "testFieldName",
          field_type: "testFieldType",
          label: labelText,
        },
      ]);
    });
  });

  describe("CreateConnection", () => {
    it("returns a response object", async () => {
      expect(await testAdapterA.CreateConnection({
        institution_id: 'institution_id',
        credentials: []
      }, "test")).toEqual({
        id: "testId",
        cur_job_id: "testJobId",
        institution_code: "testCode",
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        aggregator,
      });
    });
  });

  describe("verification flow", () => {
    it("doesn't return a challenge if the job type isn't verification", async () => {
      const userId = "testUserId";

      const successStatus = {
        ...successConnectionStatus,
        user_id: userId,
      };

      await testAdapterA.UpdateConnection(
        {
          job_type: MappedJobTypes.AGGREGATE,
        } as any,
        userId,
      );

      expect(
        await testAdapterA.GetConnectionStatus("test", "test", true, userId),
      ).toEqual(successStatus);
    });

    it("returns success if it hasn't been verified once, returns success if the job type is verification, it has been verified once, and single_account_select is false, returns a challenge if the job type if verification and it has been verified once and single_account_select is true. returns success after a second verification", async () => {
      const userId = "testUserId";

      const successStatus = {
        ...successConnectionStatus,
        user_id: userId,
      };

      expect(
        await testAdapterA.GetConnectionStatus("test", "test", true, userId),
      ).toEqual(successStatus);

      await testAdapterA.UpdateConnection(
        {
          job_type: MappedJobTypes.VERIFICATION,
        } as any,
        userId,
      );

      expect(
        await testAdapterA.GetConnectionStatus("test", "test", false, userId),
      ).toEqual(successStatus);

      expect(
        await testAdapterA.GetConnectionStatus("test", "test", true, userId),
      ).toEqual({
        aggregator,
        id: "testId",
        cur_job_id: "testJobId",
        user_id: "testUserId",
        status: ConnectionStatus.CHALLENGED,
        challenges: [
          {
            id: "CRD-a81b35db-28dd-41ea-aed3-6ec8ef682011",
            type: 1,
            question: "Please select an account:",
            data: [
              {
                key: "Checking",
                value: "act-23445745",
              },
              {
                key: "Savings",
                value: "act-352386787",
              },
            ],
          },
        ],
      });

      await testAdapterA.UpdateConnection(
        {
          job_type: MappedJobTypes.VERIFICATION,
        } as any,
        userId,
      );

      expect(
        await testAdapterA.GetConnectionStatus("test", "test", false, userId),
      ).toEqual(successStatus);

      expect(
        await testAdapterA.GetConnectionStatus("test", "test", true, userId),
      ).toEqual(successStatus);
    });
  });

  describe("DeleteConnection", () => {
    it("responds with a ", async () => {
      expect(
        await testAdapterA.DeleteConnection("testId", "testUserId"),
      ).toEqual(undefined);
    });
  });

  describe("DeleteUser", () => {
    it("responds with 204 on success", async () => {
      expect(await testAdapterA.DeleteUser("testUserId")).toEqual({
        status: 204,
        data: "",
      });
    });
  });

  describe("UpdateConnection", () => {
    it("returns a response object", async () => {
      expect(
        await testAdapterA.UpdateConnection(
          {
            job_type: MappedJobTypes.AGGREGATE,
          } as any,
          "test",
        ),
      ).toEqual({
        id: "testId",
        cur_job_id: "testJobId",
        institution_code: "testCode",
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        aggregator,
      });
    });
  });

  describe("UpdateConnectionInternal", () => {
    it("returns a response object", async () => {
      expect(
        await testAdapterA.UpdateConnectionInternal(undefined, "test"),
      ).toEqual({
        id: "testId",
        cur_job_id: "testJobId",
        institution_code: "testCode",
        is_being_aggregated: false,
        is_oauth: false,
        oauth_window_uri: undefined,
        aggregator,
      });
    });
  });

  describe("GetConnectionById", () => {
    it("returns a response object", async () => {
      expect(await testAdapterA.GetConnectionById(undefined, "test")).toEqual({
        id: "testId",
        institution_code: "testCode",
        is_oauth: false,
        is_being_aggregated: false,
        oauth_window_uri: undefined,
        aggregator,
        user_id: "test",
      });
    });
  });

  describe("GetConnectionStatus", () => {
    it("returns a response object", async () => {
      expect(
        await testAdapterA.GetConnectionStatus("test", "test", false, "userId"),
      ).toEqual(successConnectionStatus);
    });
  });

  describe("AnswerChallenge", () => {
    it("returns a response object", async () => {
      expect(
        await testAdapterA.AnswerChallenge(undefined, "test", "test"),
      ).toEqual(true);
    });
  });

  describe("ResolveUserId", () => {
    it("returns a response object", async () => {
      expect(await testAdapterA.ResolveUserId("userId", false)).toEqual(
        "userId",
      );
    });
  });
  describe("HandleOauthResponse", () => {
    it("responds success from HandleOauthResponse", async () => {
      await set(`request_id`, {
        guid: 'test_guid',
        id: 'request_id'
      });
  
      const ret = await testAdapterA.HandleOauthResponse({
        query: {
          state: 'request_id',
          code: 'test_code'
        }
      });
  
      expect(ret).toEqual({
          id: "request_id",
          request_id: "request_id",
          guid: 'test_guid',
          user_id: 'test_code',
          status: 6
        })
    });
    
    it("returns null with no query", async () => {
      const ret = await testAdapterA.HandleOauthResponse({
        query: null
      });
      expect(ret).toEqual(null)
    });

    it("returns null with no data", async () => {
      const ret = await testAdapterA.HandleOauthResponse({
        query: {
          state: 'request_id',
          code: 'test_code'
        }
      });
      expect(ret).toEqual(null)
    });
  });
});

