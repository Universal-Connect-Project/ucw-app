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
  const [aggregator, setAggregator] = useState<string>("");
  const [jobTypes, setJobTypes] = useState<ComboJobTypes[]>([]);
  const [institutionId, setInstitutionId] = useState<string>("");
  const [targetOrigin, setTargetOrigin] = useState<string>("");

  const queryParams = new URLSearchParams(window.location.search);

  const token = queryParams.get("token") as string;

  const instrumentationProps = {
    token,
  };

  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    instrumentation(instrumentationProps)
      .then((response) => {
        setConnectionId(response.data.connectionId);
        setAggregator(response.data.aggregator);
        setJobTypes(response.data.jobTypes);
        setInstitutionId(response.data.institutionId);
        setTargetOrigin(response.data.targetOrigin);
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
