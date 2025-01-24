/**
 * ConnectAPIService adds an abstraction layer between how our code asks for
 * remote data and the concrete implementation.
 *
 * For example, we don't have to rely on FireflyAPI if we want to move to
 * another API source instead in the future. It also leaves the option of
 * using axios or any other http library up the implementation
 */
export class ConnectAPIService {
  constructor(dataSource) {
    this.dataSource = dataSource;

    console.log({ dataSource });
  }
  /**
   *
   * @returns {Promise<Object>} - api response with client configs
   */
  loadMaster() {
    console.log("loadMaster");
    return this.dataSource.loadMaster();
  }
  /**
   * @returns - no data is returned
   */
  extendSession() {
    console.log("extendSession");
    return this.dataSource.extendSession();
  }
  /**
   * @returns - no data is returned
   */
  logout() {
    console.log("logout");
    return this.dataSource.logout();
  }
  /**
   *
   * @param {Object} configOptions
   * @returns - no data is returned
   */
  instrumentation(configOptions) {
    console.log("instrumentation");
    return this.dataSource.instrumentation(configOptions);
  }
  /**
   *
   * @param {*} memberData
   * @param {Object} config - configs for MXconnect
   * @param {string} config.client_redirect_url
   * @param {boolean} config.include_transactions
   * @param {string} config.mode
   * @param {string} config.oauth_referral_source
   * @param {boolean|null} config.disable_background_agg
   * @param {boolean} config.is_mobile_webview
   * @param {string} config.ui_message_webview_url_scheme
   * @param {boolean} isHuman
   */
  addMember(memberData, config = {}, isHuman = false) {
    console.log("addMember");
    return this.dataSource.addMember(memberData, config, isHuman);
  }
  /**
   *
   * @param {Object} member
   * @param {Object} connectConfig - configs for MXconnect
   * @param {boolean} connectConfig.include_transactions
   * @param {boolean} isHuman
   * @returns {Promise<object>} - updated member object
   */
  updateMember(member, connectConfig = {}, isHuman = false) {
    console.log("updateMember");
    return this.dataSource.updateMember(member, connectConfig, isHuman);
  }

  /**
   *
   * @param {Object} member
   * @param {Object} connectConfig - configs for MXconnect
   * @param {boolean} connectConfig.include_transactions
   * @param {boolean} isHuman
   * @returns {Promise<object>} - updated member object
   */
  updateMFA(member, connectConfig = {}, isHuman = false) {
    console.log("updateMFA");
    return this.dataSource.updateMFA(member, connectConfig, isHuman);
  }

  /**
   *
   * @param {Object} member
   * @returns {Promise<object>} - API response with null
   */
  deleteMember(member) {
    console.log("deleteMember");
    return this.dataSource.deleteMember(member);
  }
  /**
   *
   * @returns {Promise<Array>} - API response with members
   */
  loadMembers() {
    console.log("loadMembers");
    return this.dataSource.loadMembers();
  }
  /**
   *
   * @param {string} memberGuid
   * @returns {Promise<Object>} - API response with requested member
   */
  loadMemberByGuid(memberGuid) {
    console.log("loadMemberByGuid");
    return this.dataSource.loadMemberByGuid(memberGuid);
  }

  /**
   *
   * @param {Object} queryObject
   * @returns {Promise<Object>} - API response with OAuth State
   */
  loadOAuthStates(queryObject) {
    console.log("loadOAuthStates");
    return this.dataSource.loadOAuthStates(queryObject);
  }

  /**
   *
   * @param {String} oauthStateGuid
   * @returns {Promise<Object>} - API response with OauthState
   */
  loadOAuthState(oauthStateGuid) {
    console.log("loadOauthState");
    return this.dataSource.loadOAuthState(oauthStateGuid);
  }

  /**
   *
   * @param {Object} feedback - The feedback from end-user.
   * @param {string} feedback.rating - The rating from end-user.
   * @param {string} feedback.comment - The comment from end-user.
   * @param {string} feedback.source - The source/connection_status from member.
   * @returns {Promise<object>} - API response with feedback object
   */
  submitConnectFeedback(feedback) {
    console.log("submitConnectFeedback");
    return this.dataSource.submitConnectFeedback(feedback);
  }
  /**
   *
   * @param {Object} ticket - The ticket from end-user.
   * @param {string} ticket.email - The email from end-user.
   * @param {string} ticket.message - The message from end-user.
   * @param {string} ticket.title - The title from end-user.
   * @returns {Promise<object>} - API response with empty body
   */
  createSupportTicket(ticket) {
    console.log("createSupportTicket");
    return;
  }

  /**
   *
   * @param {Object} query
   * @returns {Promise<Array>} - API response with an array of institutions
   */
  loadInstitutions(query) {
    console.log("loading institutions", query);

    return this.dataSource.loadInstitutions(query);
  }

  /**
   *
   * @param {string} guid
   * @returns {Promise<Object>} - API Response with Institution
   */
  loadInstitutionByGuid(guid) {
    console.log("loadInstitutionByGuid");
    return this.dataSource.loadInstitutionByGuid(guid);
  }

  /**
   *
   * @param {string} code
   * @returns {Promise<Object>} - API Response with Institution
   */
  loadInstitutionByCode(code) {
    console.log("loadInstitutionByCode");
    return this.dataSource.loadInstitutionByCode(code);
  }

  /**
   *
   * @param {Object} query
   * @returns {Promise<Array>} - API Response with an Array of institutions
   */
  loadPopularInstitutions(query) {
    console.log("loading popular institutions");
    return this.dataSource.loadPopularInstitutions(query);
  }

  /**
   * @returns {Promise<Array>} - API Response with an Array of institutions
   */
  loadDiscoveredInstitutions() {
    console.log("loadDiscoveredInstitutions");
    return this.dataSource.loadDiscoveredInstitutions();
  }

  /**
   * This is used for creating manual accounts.
   * @param {Object} account - The account details
   * @returns {Promise<Object>} API response with account object
   */
  createAccount(account) {
    console.log("createAccount");
    return this.dataSource.createAccount(account);
  }

  /**
   *
   * @param {Array<String>} accountGuids
   * @returns {Promise<Object>} API response with account
   */
  mergeAccounts(accountGuids) {
    console.log("mergeAccounts");
    return this.dataSource.mergeAccounts(accountGuids);
  }

  /**
   *
   * @returns {Promise<Object>} API response with accounts
   */
  loadAccounts() {
    console.log("loadAccounts");
    return this.dataSource.loadAccounts();
  }

  /**
   *
   * @returns {Promise<Object>} API response with accounts and members
   */
  loadAccountsAndMembers() {
    console.log("loadAccountsAndMembers");
    return this.dataSource.loadAccountsAndMembers();
  }
  /**
   *
   * @param {Object} account
   * @returns {Promise<Object>} API response with account
   */
  saveAccount(account) {
    console.log("saveAccount");
    return this.dataSource.saveAccount(account);
  }

  /**
   *
   * @param {string} currentMemberGuid
   * @returns {Promise<Object>} API response with accounts
   */
  loadAccountsByMember(currentMemberGuid) {
    console.log("loadAccountsByMember");
    return this.dataSource.loadAccountsByMember(currentMemberGuid);
  }

  /**
   *
   * @param {Object} microdeposit
   * @returns {Promise<Object>} API response with micro_deposit
   */
  createMicrodeposit(microdeposit) {
    console.log("createMicrodeposit");
    return this.dataSource.createMicrodeposit(microdeposit);
  }

  /**
   *
   * @param {string} microdepositGuid ex. MIC-123
   *
   * @returns {Promise<Object>} API response with micro_deposit
   */
  loadMicrodepositByGuid(microdepositGuid) {
    console.log("loadMicrodepositByGuid");
    return this.dataSource.loadMicrodepositByGuid(microdepositGuid);
  }

  /**
   * Update Microdeposit - This only works with PREINITIATED MicroDeposits. Once you update a PREINITIATED
   * MicroDeposit, it will automatically start the process and switch to REQUESTED.
   * @param {string} microdepositGuid - ex. MIC-123
   * @param {Object} updatedData - Cannot update `deposit_amount_1` or `deposit_amount_2`
   * @param {string} updatedData.account_name - The account name from the end-user
   * @param {string} updatedData.account_number - The account number from the end-user
   * @param {string} updatedData.account_type - The account type from the end-user
   * @param {string} updatedData.email - The email from the end-user
   * @param {string} updatedData.first_name - The first name from the end-user
   * @param {string} updatedData.last_name - The last name from the end-user
   * @param {string} updatedData.routingNumber- The routing number from the end-user
   *
   * @returns {Promise<Object>} API response with micro_deposit
   */
  updateMicrodeposit(microdepositGuid, updatedData) {
    console.log("updateMicrodeposit");
    return this.dataSource.updateMicrodeposit(microdepositGuid, updatedData);
  }

  /**
   *
   * @param {string} microdepositGuid
   * @returns {Promise<Object>} API response with micro_deposit
   */
  refreshMicrodepositStatus(microdepositGuid) {
    console.log("refreshMicrodepositStatus");
    return this.dataSource.refreshMicrodepositStatus(microdepositGuid);
  }

  /**
   *
   * @param {string} microdepositGuid - Mic-123
   * @param {Object} amountData
   * @param {string} amountData.deposit_amount_1
   * @param {string} amountData.deposit_amount_2
   * @returns {Promise<Object>}
   */
  verifyMicrodeposit(microdepositGuid, amountData) {
    console.log("verifyMicrodeposit");
    return this.dataSource.verifyMicrodeposit(microdepositGuid, amountData);
  }

  /**
   *
   * @param {string} routingNumber
   * @returns {Promise<Object>}
   */
  verifyRoutingNumber(routingNumber, accountIdentificationEnabled) {
    console.log("verifyRoutingNumber");

    return this.dataSource.verifyRoutingNumber(
      routingNumber,
      accountIdentificationEnabled,
    );
  }

  /**
   *
   * @param {string} jobGuid
   * @returns {Promise<Object>} - API response with job
   */
  loadJob(jobGuid) {
    console.log("loadJob");
    return this.dataSource.loadJob(jobGuid);
  }

  /**
   *
   * @param {string} jobType
   * @param {string} memberGuid
   * @param {Object} connectConfig - configs for MXconnect
   * @param {boolean} connectConfig.include_transactions
   * @param {boolean} isHuman
   * @returns {Promise<object>} - member object
   */
  runJob(jobType, memberGuid, connectConfig = {}, isHuman = false) {
    console.log("runJob");
    return this.dataSource.runJob(jobType, memberGuid, connectConfig, isHuman);
  }

  /**
   *
   * @param {string} institutionGuid "INS-123"
   * @returns {Promise<object>} - API response with credentials
   */
  getInstitutionCredentials(institutionGuid) {
    console.log("getInstitutionCredentials");
    return this.dataSource.getInstitutionCredentials(institutionGuid);
  }

  /**
   *
   * @param {string} memberGuid "MBR-123"
   * @returns {Promise<object>} - API response with credentials
   */
  getMemberCredentials(memberGuid) {
    console.log("getMemberCredentials");
    return this.dataSource.getMemberCredentials(memberGuid);
  }

  /**
   *
   * @param {string} memberGuid
   * @param {Object} config - configs for MXconnect
   * @param {boolean} config.include_transactions
   * @param {boolean} isHuman
   * @returns {Promise<object>} - member object
   */
  aggregate(memberGuid, config = {}, isHuman = false) {
    console.log("aggregate");
    return this.dataSource.aggregate(memberGuid, config, isHuman);
  }

  /**
   *
   * @param {string} memberGuid
   * @param {Object} config
   * @returns {Promise<Object>} - API Response with OAuth uri
   */
  getOAuthWindowURI(memberGuid, config) {
    console.log("getOAuthWindowURI");
    return this.dataSource.getOAuthWindowURI(memberGuid, config);
  }

  /**
   *
   * @param {Object} options
   * @returns {Promise<Object>} - api response with analytics session
   */
  createAnalyticsSession(options) {
    console.log("createAnalyticsSession");
    return this.dataSource.createAnalyticsSession(options);
  }

  /**
   *
   * @param {Object} session
   * @returns {Promise<Object>} - api response with analytics session
   */
  closeAnalyticsSession(session) {
    console.log("closeAnalyticsSession");
    return this.dataSource.closeAnalyticsSession(session);
  }

  /**
   *
   * @param {Object} userProfile
   * @returns {Promise<Object>} - api response with user profile
   */
  updateUserProfile(userProfile) {
    console.log("updateUserProfile");
    return this.dataSource.updateUserProfile(userProfile);
  }
}
