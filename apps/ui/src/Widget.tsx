// @ts-expect-error import doesn't work
import { ApiProvider, ConnectWidget } from "@mxenabled/connect-widget";
import "./App.css";
import connectWidgetApiService from "./api/connectWidgetApiService";
import { ComboJobTypes } from "@repo/utils";

const Widget = ({
  aggregator,
  connectionId,
  institutionId,
  jobTypes,
}: {
  aggregator: string;
  connectionId: string;
  institutionId: string;
  jobTypes: ComboJobTypes[];
}) => {
  const disableInstitutionSearch = !!(institutionId || connectionId);

  const clientConfig = {
    current_institution_guid: institutionId,
    current_member_guid: connectionId,
    data_request: {
      products: jobTypes,
    },
    disable_institution_search: disableInstitutionSearch,
    update_credentials: connectionId && aggregator,
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
        onPostMessage={(type: string, metadata?: object) => {
          const payload = {
            metadata,
            type,
          };

          if (window.parent) {
            window.parent.postMessage(payload);
          }
          if (window.opener) {
            window.opener.postMessage(payload);
          }
        }}
        profiles={{
          clientProfile: {
            account_verification_is_enabled: true,
            uses_oauth: true,
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
