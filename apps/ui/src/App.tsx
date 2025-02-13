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

  const connectionId = queryParams.get("connection_id") as string;
  const aggregator = queryParams.get("aggregator") as string;
  const jobTypes = queryParams.get("jobTypes")?.split(",") as ComboJobTypes[];
  const institutionId = queryParams.get("institution_id") as string;
  const userId = queryParams.get("user_id") as string;
  const singleAccountSelect =
    queryParams.get("single_account_select") !== "false";

  const instrumentationProps = {
    user_id: userId,
    current_member_guid: connectionId,
    current_aggregator: aggregator,
    jobTypes,
    single_account_select: singleAccountSelect,
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
    />
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export default withErrorBoundary(App, {
  fallback: <div>Something went wrong</div>,
});
