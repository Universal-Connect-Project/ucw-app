// @ts-expect-error import doesn't work
import { ApiProvider, ConnectWidget } from "@mxenabled/connect-widget";
import "@mxenabled/connect-widget/dist/style.css";
import "./App.css";
import createConnectWidgetApiService from "./api/connectWidgetApiService";
import { ComboJobTypes } from "@repo/utils";
import postMessageEventOverrides from "./postMessageEventOverrides";
import { startOauthPerformance } from "./api/api";

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
        onAnalyticEvent={(type: string, event: object) => {
          if (type === "connect_oauth_default_go_to_institution") {
            const {
              rawInstitution: { ucpInstitutionId },
            } = event as { rawInstitution: { ucpInstitutionId: string } };

            startOauthPerformance({
              institutionId: ucpInstitutionId,
            });
          }
        }}
        onAnalyticPageview={() => {}}
        onPostMessage={(type: string, metadata?: object) => {
          const payload = {
            metadata,
            type,
          };

          if (window.parent) {
            window.parent.postMessage(payload, { targetOrigin });
          }
          if (window.opener) {
            window.opener.postMessage(payload, { targetOrigin });
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
