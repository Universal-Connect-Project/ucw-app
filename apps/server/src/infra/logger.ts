import config from "../config";

const levels = {
  debug: -1,
  trace: 0,
  info: 1,
  warning: 2,
  error: 3
};

const LogLevel: keyof typeof levels = config.LogLevel ?? "info";

interface LogDoc {
  Level: string;
  Component: string;
  Env: string;
  Request: Record<string, never>;
  "@timestamp": string;
  Message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Data?: any;
  Error?: { message: string; stack: string };
}

const startDoc = (): LogDoc => {
  return {
    Level: "trace",
    Component: config.Component,
    Env: config.Env ?? "dev",
    Request: {},
    "@timestamp": new Date().toISOString()
  };
};

const logDoc = (doc: LogDoc): void => {
  if (
    levels[LogLevel] > levels[LogLevel] ||
    process.env.NODE_ENV === "test"
  ) {
    return;
  }
  if (config.Env === "dev") {
    console.log(doc);
  } else {
    console.log(JSON.stringify(doc));
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const logMessage = (message: string, level: string, data?: any, isError?: boolean): void => {
  const doc = startDoc();
  doc.Level = level ?? doc.Level;
  doc.Message = message;
  if (isError != null && data != null) {
    doc.Error = { message: data.message ?? data, stack: data.stack };
  } else {
    doc.Data = data;
  }
  logDoc(doc);
};


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const error = (message: string, error: any): void => {
  logMessage(message, "error", error, true);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const info = (message: string, data?: any): void => {
  logMessage(message, "info", data);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const warning = (message: string, data?: any): void => {
  logMessage(message, "warning", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const trace = (message: string, data?: any): void => {
  logMessage(message, "trace", data);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const debug = (message: string, data?: any): void => {
  logMessage(message, "debug", data);
}