// @ts-expect-error import doesn't work
import { ApiProvider, ConnectWidget } from "@mxenabled/connect-widget";
import "@mxenabled/connect-widget/dist/style.css";
import "./App.css";
import createConnectWidgetApiService from "./api/connectWidgetApiService";
import { ComboJobTypes } from "@repo/utils";
import postMessageEventOverrides from "./postMessageEventOverrides";

const Widget = ({
  aggregator,
  connectionId,
  institutionId,
  jobTypes,
  targetOrigin,
}: {
  aggregator: string;
  connectionId: string;
  institutionId: string;
  jobTypes: ComboJobTypes[];
  targetOrigin: string | undefined;
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
    target_origin: targetOrigin,
  };

  const connectWidgetApiService = createConnectWidgetApiService({
    institutionId,
  });

  return (
    <ApiProvider apiValue={connectWidgetApiService}>
      <ConnectWidget
        clientConfig={clientConfig}
        language={{ locale: "en" }}
        onAnalyticEvent={() => {}}
        onAnalyticPageview={() => {}}
        onPostMessage={(type: string, metadata?: object) => {
          if (!targetOrigin) {
            console.warn(
              "🚨 SECURITY WARNING: targetOrigin is not defined. " +
                "This could allow sensitive data to be stolen via cross-site scripting. " +
                "Always specify a targetOrigin when embedding this widget.",
            );
          }

          const payload = {
            metadata,
            type,
          };

          if (window.parent) {
            window.parent.postMessage(payload, targetOrigin || "*");
          }
          if (window.opener) {
            window.opener.postMessage(payload, targetOrigin || "*");
          }
        }}
        postMessageEventOverrides={postMessageEventOverrides}
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
