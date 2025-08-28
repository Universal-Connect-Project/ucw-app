/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request } from "express";
import {
  getAggregatorFromContext,
  getAggregatorOverrideFromContext,
  getCurrentJobIdFromContext,
  getJobTypesFromContext,
  getPerformanceSessionIdFromContext,
  getResolvedUserIdFromContext,
  setAggregatorOnContext,
  setCurrentJobIdOnContext,
  setPerformanceSessionIdOnContext,
  setResolvedUserIdOnContext,
} from "./context";

const createContextGetterTest = ({
  getter,
  name,
}: {
  getter: (req: Request) => any;
  name: string;
}) =>
  describe(name, () => {
    it("returns the correct value from the context", () => {
      const req = {
        context: {
          [name]: "test",
        },
      } as unknown as Request;

      expect(getter(req)).toBe("test");
    });
  });

interface RequestWithContext extends Request {
  context: Record<string, any>;
}

type SetterFunction = (params: {
  req: RequestWithContext;
  [key: string]: any;
}) => void;

const createContextSetterTest = ({
  contextName,
  propName,
  setter,
}: {
  contextName: string;
  propName: string;
  setter: SetterFunction;
}) => {
  describe(contextName, () => {
    it("sets the correct value in the context", () => {
      const req = {
        context: {},
      } as unknown as RequestWithContext;

      setter({ req, [propName || contextName]: "test" });

      expect(req.context[contextName]).toBe("test");
    });
  });
};

describe("context utils", () => {
  describe("setters", () => {
    [
      [setAggregatorOnContext, "aggregator", "aggregatorId"],
      [setCurrentJobIdOnContext, "current_job_id", "currentJobId"],
      [setPerformanceSessionIdOnContext, "performanceSessionId"],
      [setResolvedUserIdOnContext, "resolvedUserId"],
    ].map(([setter, contextName, propName]) => {
      createContextSetterTest({
        contextName: contextName as string,
        propName: propName as string,
        setter: setter as SetterFunction,
      });
    });
  });

  describe("getters", () => {
    [
      [getAggregatorFromContext, "aggregator"],
      [getAggregatorOverrideFromContext, "aggregatorOverride"],
      [getCurrentJobIdFromContext, "current_job_id"],
      [getJobTypesFromContext, "jobTypes"],
      [getPerformanceSessionIdFromContext, "performanceSessionId"],
      [getResolvedUserIdFromContext, "resolvedUserId"],
    ].map(([getter, name]) => {
      createContextGetterTest({
        getter: getter as (req: Request) => any,
        name: name as string,
      });
    });
  });
});
