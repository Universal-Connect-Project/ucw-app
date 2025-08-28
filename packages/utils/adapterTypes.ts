import { ComboJobTypes } from "./contract";

export type CacheClient = {
  set: (key: string, value: any, params?: unknown) => Promise<void> | void;
  get: (key: string) => Promise<any> | any;
};

export type LogClient = {
  info: (message: string, error?: any) => void;
  error: (message: string, data?: any) => void;
  debug: (message: string, data?: any) => void;
  trace: (message: string, data?: any) => void;
  warning: (message: string, data?: any) => void;
};

export interface PerformanceClient {
  recordStartEvent: ({
    aggregatorId,
    connectionId,
    institutionId,
    jobTypes,
  }: {
    aggregatorId: string;
    connectionId: string;
    institutionId: string;
    jobTypes: ComboJobTypes[];
  }) => Promise<void>;
  recordSuccessEvent: (
    performanceSessionId: string,
    aggregatorConnectionId?: string,
  ) => Promise<void>;
  recordConnectionPauseEvent: ({
    connectionId,
  }: {
    connectionId: string;
  }) => Promise<void>;
  recordConnectionResumeEvent: ({
    connectionId,
  }: {
    connectionId: string;
  }) => Promise<void>;
}
