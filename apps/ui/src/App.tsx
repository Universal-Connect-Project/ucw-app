import { useState, useEffect } from "react";
// @ts-expect-error import doesn't work
import { ApiProvider, ConnectWidget } from "@mxenabled/connect-widget";
import { ReactElement } from "react";
import { instrumentation } from "./connect/api";
import "./App.css";
import connectWidgetApiService from "./connect/connectWidgetApiService";

function App(): ReactElement | string | null {
  const [instrumentationFinished, setInstrumentationFinished] = useState(false);
  const [instrumentationError, setInstrumentationError] = useState(false);

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

  useEffect(() => {
    instrumentation(clientConfig.connect)
      .then(() => {
        setInstrumentationFinished(true);
      })
      .catch(() => {
        setInstrumentationError(true);
      });
  });

  if (instrumentationError) {
    return "Something went wrong";
  }

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
}

export default App;
