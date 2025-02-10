// @ts-expect-error import doesn't work
import { ApiProvider, ConnectWidget } from "@mxenabled/connect-widget";
import "./App.css";
import connectWidgetApiService from "./api/connectWidgetApiService";

const Widget = ({
  connectionId,
  institutionId,
  jobType,
}: {
  connectionId: string;
  institutionId: string;
  jobType: string;
}) => {
  console.log(jobType);

  const clientConfig = {
    current_institution_code: institutionId,
    current_member_guid: connectionId,
    disable_institution_search: !!(institutionId || connectionId),
    mode: "aggregation", // Does this need to change for verification jobs?
    ui_message_protocol: "post_message",
    ui_message_version: 4,
    ui_message_webview_url_scheme: "vcs",
    wait_for_full_aggregation: false,
  };

  return (
    <ApiProvider apiValue={connectWidgetApiService}>
      <ConnectWidget
        clientConfig={clientConfig}
        language={{ locale: "en" }}
        onAnalyticEvent={() => {}}
        onAnalyticPageview={() => {}}
        onPostMessage={() => {}}
        profiles={{}}
        userFeatures={[
          { feature_name: "CONNECT_COMBO_JOBS", is_enabled: true },
        ]}
      />
    </ApiProvider>
  );
};

export default Widget;
