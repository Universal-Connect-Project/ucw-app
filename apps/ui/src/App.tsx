import { useState, useEffect } from "react";
// @ts-expect-error import doesn't work
import { ApiProvider, ConnectWidget } from "@mxenabled/connect-widget";
import { ReactElement } from "react";
import { instrumentation } from "./connect/api";
import "./App.css";
import connectWidgetApiService from "./connect/connectWidgetApiService";

function App(): ReactElement | null {
  const [instrumentationFinished, setInstrumentationFinished] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);

  const connectionId = queryParams.get("connection_id");
  const aggregator = queryParams.get("aggregator");
  const jobType = queryParams.get("job_type");
  const institutionId = queryParams.get("institution_id");
  const userId = queryParams.get("user_id");
  const singleAccountSelect = queryParams.get("single_account_select");

  const clientConfig = {
    // is_mobile_webview: params.is_mobile_webview === "true",
    // target_origin_referrer: null,
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
      // current_partner: "$partner",
      user_id: userId,
      current_microdeposit_guid: null,
      disable_background_agg: null,
      disable_institution_search: !!(institutionId || connectionId),
      // include_identity: params.include_identity === "true",
      // include_transactions: null, // true
      oauth_referral_source: "BROWSER",
      // update_credentials: params.update_credentials === "true",
      wait_for_full_aggregation: false,
      single_account_select: singleAccountSelect !== "false",
      scheme: "vcs",
    },
  };

  useEffect(() => {
    instrumentation(clientConfig.connect).then(() => {
      setInstrumentationFinished(true);
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
}

export default App;
