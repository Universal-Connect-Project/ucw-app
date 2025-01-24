/* eslint-disable no-unused-vars */
// TODO: REMOVE no-unused-vars
import _get from "lodash/get";
import _reduce from "lodash.reduce";
import _isArray from "lodash.isarray";

import { REFERRAL_SOURCES, VERIFY_MODE } from "./constants";

export const ApiEndpoints = {
  MEMBERS: "/members",
  INSTITUTIONS: "/institutions",
  INSTRUMENTATION: "/instrumentation",
};

function getHumanInteractionGuid(isHuman) {
  const token = _get(window, ["app", "options", "session_token"], "");

  return window.btoa(token.slice(0, 10)) + (isHuman ? "1" : "0");
}

/**
 * FireflyDataSource is made to be used with ConnectAPIService.
 *
 * Each method that exists in ConnectAPIService should also exist
 * as a method here.  Until we have something like Typescript to
 * help with type safety, we much ensure proper implementation
 * using tests and other means.
 */
export class FireflyDataSource {
  constructor(axios) {
    this.axios = axios;
  }

  /**
   * Build a single query paramter from a key and a value. Value cannot be an
   * object, it must be a primative or an array of primatives
   *
   * See tests for examples
   */
  buildQueryParameter(key, value) {
    return _isArray(value)
      ? value.map((val) => `${key}[]=${encodeURIComponent(val)}`).join("&")
      : `${key}=${encodeURIComponent(value)}`;
  }

  /**
   * Build a query string from an object. This doesn't handle query values that
   * are objects. Just primatives, and arrays of primatives.
   *
   * See tests for examples
   */
  buildQueryString(queryObj) {
    return _reduce(
      queryObj,
      (queryStr, value, queryName) => {
        const queryParam = this.buildQueryParameter(queryName, value);

        return queryStr === "" ? `?${queryParam}` : `${queryStr}&${queryParam}`;
      },
      "",
    );
  }

  /**
   *
   * @param {*} memberData
   * @param {Object} connectConfig - configs for MXconnect
   * @param {string} connectConfig.client_redirect_url
   * @param {boolean} connectConfig.include_transactions
   * @param {string} connectConfig.mode
   * @param {string} connectConfig.oauth_referral_source
   * @param {boolean|null} connectConfig.disable_background_agg
   * @param {Object} appConfig - configs for the app
   * @param {boolean} appConfig.is_mobile_webview
   * @param {string} appConfig.ui_message_webview_url_scheme
   * @param {boolean} isHuman
   */
  addMember(memberData, connectConfig = {}, appConfig = {}, isHuman = false) {
    const referralSource =
      appConfig.is_mobile_webview === true
        ? REFERRAL_SOURCES.APP
        : (connectConfig.oauth_referral_source ?? REFERRAL_SOURCES.BROWSER);

    /* When creating new members in Verify Mode, Background Aggregation is DISABLED by default.
       When creating new members in other modes, Background Aggregation is ENABLED.

       If desired, Clients can pass a boolean value for 'disable_background_agg' to connect's config
       which will allow new members to be created with that value for 'background_aggregation_is_disabled'

       See the addMember tests for more info: src/utils/__tests__/FireflyAPI-test.js
    */
    const background_aggregation_is_disabled = Boolean(
      connectConfig.disable_background_agg ??
        connectConfig.mode === VERIFY_MODE,
    );

    return this.axios
      .post(
        ApiEndpoints.MEMBERS,
        {
          ...memberData,
          background_aggregation_is_disabled,
          client_redirect_url: connectConfig.client_redirect_url ?? null,
          include_transactions: connectConfig.include_transactions ?? null,
          referral_source: referralSource,
          skip_aggregation: true,
          ui_message_webview_url_scheme:
            appConfig.ui_message_webview_url_scheme ?? "mx",
        },
        {
          headers: {
            "x-inter-hu": getHumanInteractionGuid(isHuman),
          },
        },
      )
      .then((response) => response.data);
  }

  updateMember(member, connectConfig = {}, isHuman = false) {}
  loadMembers() {
    return Promise.resolve([]);
  }
  loadMemberByGuid(memberGuid) {}
  deleteMember(member) {} // TODO - we could change this to be a guid only if we want

  submitConnectFeedBack(feedBack) {}
  createSupportTicket(ticket) {}

  loadInstitutions(query) {}
  loadInstitutionByGuid(guid) {}
  loadInstitutionByCode(code) {}
  loadPopularInstitutions(query) {
    console.log("in firefly loadPopularInstitutions", query);

    const url =
      typeof query === "undefined"
        ? `${ApiEndpoints.INSTITUTIONS}/favorite`
        : `${ApiEndpoints.INSTITUTIONS}/favorite${this.buildQueryString(query)}`;

    return this.axios.get(url).then((response) => {
      return response.data;
    });
  }
  loadDiscoveredInstitutions() {}

  createAccount(account) {}
  loadAccounts() {}

  instrumentation(configOptions) {
    const { connect, ...rest } = configOptions;

    const config = {
      instrumentation: {
        ...rest,
        ...connect,
        widget_type: "connect_widget",
      },
      message: "widget-config",
    };

    return this.axios
      .post(ApiEndpoints.INSTRUMENTATION, config)
      .then((response) => response && response.data);
  }

  createMicrodeposit(microdeposit) {}
  loadMicrodepositByGuid(microdepositGuid) {}
  /**
   * Update Microdeposit - This only works with PREINITIATED MicroDeposits. Once you update a PREINITIATED
   * MicroDeposit, it will automatically start the process and switch to REQUESTED.
   * @param  updatedData - Include fields: `account_name`, `account_number`, `account_type`, `email`,
   * first_name`, `last_name`, and `routing_number`. Cannot update `deposit_amount_1` or `deposit_amount_2`.
   */
  updateMicrodeposit(microdepositGuid, updatedData) {}
  refreshMicrodepositStatus(microdepositGuid) {}
  verifyMicrodeposit(microdepositGuid, amountData) {}
  verifyRoutingNumber(routingNumber) {}

  loadJob(jobGuid) {}
  runJob(jobType, memberGuid, connectConfig = {}, isHuman = false) {}

  getInstitutionCredentials(institutionGuid) {}
  getMemberCredentials(memberGuid) {}

  getOAuthWindowURI(memberGuid, config) {}
}
