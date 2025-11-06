import { useState, useEffect } from "react";
import { instrumentation } from "./api/api";
import "./App.css";
import { useErrorBoundary, withErrorBoundary } from "react-error-boundary";
import Widget from "./Widget";
import { ComboJobTypes } from "@repo/utils";

// eslint-disable-next-line react-refresh/only-export-components
const App = () => {
  const [instrumentationFinished, setInstrumentationFinished] = useState(false);
  const [connectionId, setConnectionId] = useState<string>("");

  const queryParams = new URLSearchParams(window.location.search);

  const connectionToken = queryParams.get("connectionToken") as string;
  const aggregator = queryParams.get("aggregator") as string;
  const jobTypes = queryParams.get("jobTypes")?.split(",") as ComboJobTypes[];
  const institutionId = queryParams.get("institutionId") as string;
  const userId = queryParams.get("userId") as string;
  const singleAccountSelect =
    queryParams.get("singleAccountSelect") !== "false";
  const aggregatorOverride = queryParams.get("aggregatorOverride");
  const targetOrigin = queryParams.get("targetOrigin") as string;

  const instrumentationProps = {
    userId: userId,
    connectionToken,
    current_aggregator: aggregator,
    jobTypes,
    singleAccountSelect,
    aggregatorOverride,
  };

  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    instrumentation(instrumentationProps)
      .then((response) => {
        if (response?.data?.connectionId) {
          setConnectionId(response.data.connectionId);
        }
        setInstrumentationFinished(true);
      })
      .catch((error) => {
        showBoundary(error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
