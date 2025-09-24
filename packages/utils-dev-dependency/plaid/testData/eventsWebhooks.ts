// Sample events based on the webhook data structure (regular credential flow)
export const sampleCredentialEvents = [
  {
    event_id: "phone-event",
    event_metadata: {
      request_id: "initial",
    },
    event_name: "SKIP_SUBMIT_PHONE",
    timestamp: "2025-07-18T16:44:00Z", // Start: phone event
  },
  {
    event_id: "select-inst-transition",
    event_metadata: {
      request_id: "select-inst",
      view_name: "SELECT_INSTITUTION",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-07-18T16:44:01Z", // +1s: transition to select institution
  },
  {
    event_id: "select-institution",
    event_metadata: {
      institution_id: "ins_120013",
      institution_name: "America First Credit Union",
      request_id: "select-event",
    },
    event_name: "SELECT_INSTITUTION",
    timestamp: "2025-07-18T16:44:05Z", // +4s: institution selected
  },
  {
    event_id: "credential-transition",
    event_metadata: {
      institution_id: "ins_120013",
      institution_name: "America First Credit Union",
      request_id: "cred-view",
      view_name: "CREDENTIAL",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-07-18T16:44:06Z", // +1s: transition to credentials
  },
  {
    event_id: "submit-credentials",
    event_metadata: {
      institution_id: "ins_120013",
      institution_name: "America First Credit Union",
      request_id: "submit-creds",
    },
    event_name: "SUBMIT_CREDENTIALS",
    timestamp: "2025-07-18T16:44:10Z", // +4s: credentials submitted
  },
  {
    event_id: "select-account-transition",
    event_metadata: {
      institution_id: "ins_120013",
      institution_name: "America First Credit Union",
      request_id: "select-account-view",
      view_name: "SELECT_ACCOUNT",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-07-18T16:44:12Z", // +2s: transition to select account
  },
  {
    event_id: "connected-transition",
    event_metadata: {
      institution_id: "ins_120013",
      institution_name: "America First Credit Union",
      request_id: "connected-view",
      view_name: "CONNECTED",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-07-18T16:44:20Z", // +8s: connected (user interaction time, not counted)
  },
  {
    event_id: "phone-transition",
    event_metadata: {
      request_id: "final-phone-view",
      view_name: "SUBMIT_PHONE",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-07-18T16:44:22Z", // +2s: transition to phone
  },
  {
    event_id: "final-phone",
    event_metadata: {
      request_id: "final-phone",
    },
    event_name: "SKIP_SUBMIT_PHONE",
    timestamp: "2025-07-18T16:44:25Z", // +3s: final phone event
  },
  {
    event_id: "handoff",
    event_metadata: {
      institution_id: "ins_120013",
      institution_name: "America First Credit Union",
      request_id: "final",
    },
    event_name: "HANDOFF",
    timestamp: "2025-07-18T16:44:26Z", // +1s: handoff
  },
];

// Sample OAuth events
export const sampleOAuthEvents = [
  {
    event_id: "phone-event",
    event_metadata: {
      request_id: "initial",
    },
    event_name: "SKIP_SUBMIT_PHONE",
    timestamp: "2025-09-10T17:24:00Z", // Start: phone event
  },
  {
    event_id: "select-inst-transition",
    event_metadata: {
      request_id: "select-inst",
      view_name: "SELECT_INSTITUTION",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-09-10T17:24:02Z", // +2s: transition to select institution
  },
  {
    event_id: "select-institution",
    event_metadata: {
      institution_id: "ins_127287",
      institution_name: "Platypus OAuth Bank",
      request_id: "select-event",
    },
    event_name: "SELECT_INSTITUTION",
    timestamp: "2025-09-10T17:24:05Z", // +3s: institution selected
  },
  {
    event_id: "oauth-transition",
    event_metadata: {
      institution_id: "ins_127287",
      institution_name: "Platypus OAuth Bank",
      request_id: "oauth-view",
      view_name: "OAUTH",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-09-10T17:24:07Z", // +2s: transition to OAuth
  },
  {
    event_id: "open-oauth",
    event_metadata: {
      institution_id: "ins_127287",
      institution_name: "Platypus OAuth Bank",
      request_id: "open-oauth-event",
    },
    event_name: "OPEN_OAUTH",
    timestamp: "2025-09-10T17:24:10Z", // +3s: OAuth opened
  },
  {
    event_id: "final-phone",
    event_metadata: {
      request_id: "final-phone",
    },
    event_name: "SKIP_SUBMIT_PHONE",
    timestamp: "2025-09-10T17:24:15Z", // +5s: final phone event
  },
  {
    event_id: "handoff",
    event_metadata: {
      institution_id: "ins_127287",
      institution_name: "Platypus OAuth Bank",
      request_id: "final",
    },
    event_name: "HANDOFF",
    timestamp: "2025-09-10T17:24:17Z", // +2s: handoff
  },
];

export const mfaEvents = [
  {
    event_id: "skip-phone",
    event_metadata: {
      request_id: "initial",
    },
    event_name: "SKIP_SUBMIT_PHONE",
    timestamp: "2025-09-19T16:06:38Z",
  },
  {
    event_id: "select-inst-transition",
    event_metadata: {
      request_id: "select-inst",
      view_name: "SELECT_INSTITUTION",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-09-19T16:06:39Z", // +1s
  },
  {
    event_id: "select-institution",
    event_metadata: {
      institution_id: "ins_109508",
      institution_name: "First Platypus Bank",
      request_id: "select-event",
    },
    event_name: "SELECT_INSTITUTION",
    timestamp: "2025-09-19T16:08:42Z", // +2m 3s (user interaction time, not counted)
  },
  {
    event_id: "credential-transition",
    event_metadata: {
      institution_id: "ins_109508",
      institution_name: "First Platypus Bank",
      request_id: "cred-view",
      view_name: "CREDENTIAL",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-09-19T16:08:42Z", // +0s (immediate)
  },
  {
    event_id: "submit-credentials",
    event_metadata: {
      institution_id: "ins_109508",
      institution_name: "First Platypus Bank",
      request_id: "submit-creds",
    },
    event_name: "SUBMIT_CREDENTIALS",
    timestamp: "2025-09-19T16:10:05Z", // +1m 23s (user interaction time, not counted)
  },
  {
    event_id: "mfa-transition",
    event_metadata: {
      institution_id: "ins_109508",
      institution_name: "First Platypus Bank",
      request_id: "mfa-view",
      view_name: "MFA",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-09-19T16:10:08Z", // +3s: SUBMIT_CREDENTIALS to MFA
  },
  {
    event_id: "submit-mfa",
    event_metadata: {
      institution_id: "ins_109508",
      institution_name: "First Platypus Bank",
      request_id: "mfa-submit",
    },
    event_name: "SUBMIT_MFA",
    timestamp: "2025-09-19T16:10:12Z", // +4s (user interaction time, not counted)
  },
  {
    event_id: "select-account-transition",
    event_metadata: {
      institution_id: "ins_109508",
      institution_name: "First Platypus Bank",
      request_id: "select-account-view",
      view_name: "SELECT_ACCOUNT",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-09-19T16:10:14Z", // +2s: SUBMIT_MFA to SELECT_ACCOUNT
  },
  {
    event_id: "connected-transition",
    event_metadata: {
      institution_id: "ins_109508",
      institution_name: "First Platypus Bank",
      request_id: "connected-view",
      view_name: "CONNECTED",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-09-19T16:10:19Z", // +5s (user interaction time, not counted)
  },
  {
    event_id: "phone-transition",
    event_metadata: {
      request_id: "final-phone-view",
      view_name: "SUBMIT_PHONE",
    },
    event_name: "TRANSITION_VIEW",
    timestamp: "2025-09-19T16:10:21Z", // +2s: CONNECTED to SUBMIT_PHONE
  },
];
