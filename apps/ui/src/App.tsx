import { useState, useEffect } from "react";
import { instrumentation } from "./api/api";
import "./App.css";
import { useErrorBoundary, withErrorBoundary } from "react-error-boundary";
import Widget from "./Widget";
import { ComboJobTypes } from "@repo/utils";

// eslint-disable-next-line react-refresh/only-export-components
const App = () => {
  const [instrumentationFinished, setInstrumentationFinished] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);

  const connectionId = queryParams.get("connectionId") as string;
  const aggregator = queryParams.get("aggregator") as string;
  const jobTypes = queryParams.get("jobTypes")?.split(",") as ComboJobTypes[];
  const institutionId = queryParams.get("institutionId") as string;
  const userId = queryParams.get("userId") as string;
  const singleAccountSelect =
    queryParams.get("singleAccountSelect") !== "false";
  const targetOrigin = queryParams.get("targetOrigin") || undefined;

  const instrumentationProps = {
    userId: userId,
    current_member_guid: connectionId,
    current_aggregator: aggregator,
    jobTypes,
    singleAccountSelect,
  };

  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    instrumentation(instrumentationProps)
      .then(() => {
        setInstrumentationFinished(true);
      })
      .catch((error) => {
        showBoundary(error);
      });
  });

  if (!instrumentationFinished) {
    return null;
  }

  return (
    <Widget
      aggregator={aggregator}
      connectionId={connectionId}
      institutionId={institutionId}
      jobTypes={jobTypes}
      targetOrigin={targetOrigin}
    />
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export default withErrorBoundary(App, {
  fallback: <div>Something went wrong</div>,
});
