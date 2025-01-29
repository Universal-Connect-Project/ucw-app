import { useState, useEffect } from "react";
// @ts-expect-error import doesn't work
import { ApiProvider, ConnectWidget } from "@mxenabled/connect-widget";
import { instrumentation } from "./connect/api";
import "./App.css";
import connectWidgetApiService from "./connect/connectWidgetApiService";
import { useErrorBoundary, withErrorBoundary } from "react-error-boundary";

// eslint-disable-next-line react-refresh/only-export-components
const App = () => {
  const [instrumentationFinished, setInstrumentationFinished] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);

  const connectionId = queryParams.get("connection_id");
  const aggregator = queryParams.get("aggregator");
  const jobType = queryParams.get("job_type");
  const institutionId = queryParams.get("institution_id");
  const userId = queryParams.get("user_id");
  const singleAccountSelect = queryParams.get("single_account_select");

  const clientConfig = {
    ui_message_protocol: "post_message",
    ui_message_version: 4,
    ui_message_webview_url_scheme: "vcs",
    color_scheme: "light",
    connect: {
      mode: jobType,
      job_type: jobType,
      current_institution_code: institutionId,
      current_institution_guid: null,
      current_member_guid: connectionId,
      current_aggregator: aggregator,
      user_id: userId,
      current_microdeposit_guid: null,
      disable_background_agg: null,
      disable_institution_search: !!(institutionId || connectionId),
      oauth_referral_source: "BROWSER",
      wait_for_full_aggregation: false,
      single_account_select: singleAccountSelect !== "false",
      scheme: "vcs",
    },
  };

  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    instrumentation(clientConfig.connect)
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
    <ApiProvider apiValue={connectWidgetApiService}>
      <ConnectWidget
        clientConfig={clientConfig}
        language={{ locale: "en" }}
        onAnalyticEvent={() => {}}
        onAnalyticPageview={() => {}}
        onPostMessage={() => {}}
        profiles={{}}
      />
    </ApiProvider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export default withErrorBoundary(App, {
  fallback: <div>Something went wrong</div>,
});
