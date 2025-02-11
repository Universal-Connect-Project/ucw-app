// @ts-expect-error import doesn't work
import { ApiProvider, ConnectWidget } from "@mxenabled/connect-widget";
import "./App.css";
import connectWidgetApiService from "./api/connectWidgetApiService";

const Widget = ({
  connectionId,
  institutionId,
  jobTypes,
}: {
  connectionId: string;
  institutionId: string;
  jobTypes: string;
}) => {
  const clientConfig = {
    current_institution_code: institutionId,
    current_member_guid: connectionId,
    data_request: {
      products: jobTypes,
    },
    disable_institution_search: !!(institutionId || connectionId),
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
        profiles={{
          clientProfile: {
            account_verification_is_enabled: true,
          },
        }}
        userFeatures={[
          { feature_name: "CONNECT_COMBO_JOBS", is_enabled: true },
        ]}
      />
    </ApiProvider>
  );
};

export default Widget;
