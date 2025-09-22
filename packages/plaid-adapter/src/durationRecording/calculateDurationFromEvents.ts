interface WebhookEvent {
  event_id: string;
  event_metadata: {
    request_id?: string;
    institution_id?: string;
    institution_name?: string;
    view_name?: string;
    error_code?: string;
    error_message?: string;
    error_type?: string;
    [key: string]: string | undefined;
  };
  event_name: string;
  timestamp: string;
}

function isOAuthFlow(events: WebhookEvent[]): boolean {
  return events.some((event) => event.event_name === "OPEN_OAUTH");
}

const findEventsByName = (
  events: WebhookEvent[],
  eventNames: string[],
  viewName?: string,
): WebhookEvent[] => {
  return events.filter(
    (event) =>
      eventNames.includes(event.event_name) &&
      (!viewName || event.event_metadata.view_name === viewName),
  );
};

const findNextEvent = (
  events: WebhookEvent[],
  afterTimestamp: string,
  eventNames: string[],
  viewName?: string,
): WebhookEvent | null => {
  const afterTime = new Date(afterTimestamp).getTime();
  const matchingEvents = events.filter(
    (event) =>
      eventNames.includes(event.event_name) &&
      (!viewName || event.event_metadata.view_name === viewName) &&
      new Date(event.timestamp).getTime() > afterTime,
  );

  return matchingEvents.length > 0 ? matchingEvents[0] : null;
};

function calculateCredentialFlowDuration(
  events: WebhookEvent[],
  successAt?: string,
): number | null {
  // Sort events by timestamp for chronological processing
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  let totalDuration = 0;

  // Segment 1: SKIP_SUBMIT_PHONE/SUBMIT_PHONE to SELECT_INSTITUTION transition
  const phoneEvents = findEventsByName(sortedEvents, [
    "SKIP_SUBMIT_PHONE",
    "SUBMIT_PHONE",
  ]);
  if (phoneEvents.length > 0) {
    const phoneEvent = phoneEvents[0];
    const selectInstitutionTransition = findNextEvent(
      sortedEvents,
      phoneEvent.timestamp,
      ["TRANSITION_VIEW"],
      "SELECT_INSTITUTION",
    );

    if (selectInstitutionTransition) {
      const segmentDuration =
        new Date(selectInstitutionTransition.timestamp).getTime() -
        new Date(phoneEvent.timestamp).getTime();
      totalDuration += segmentDuration;
    }
  }

  // Segment 2: SELECT_INSTITUTION event to CREDENTIAL transition
  const selectInstitutionEvents = findEventsByName(sortedEvents, [
    "SELECT_INSTITUTION",
  ]);
  if (selectInstitutionEvents.length > 0) {
    const selectInstitutionEvent = selectInstitutionEvents[0];
    const credentialTransition = findNextEvent(
      sortedEvents,
      selectInstitutionEvent.timestamp,
      ["TRANSITION_VIEW"],
      "CREDENTIAL",
    );

    if (credentialTransition) {
      const segmentDuration =
        new Date(credentialTransition.timestamp).getTime() -
        new Date(selectInstitutionEvent.timestamp).getTime();
      totalDuration += segmentDuration;
    }
  }

  // Segment 3a: SUBMIT_CREDENTIALS to MFA transition (when MFA is required)
  const submitCredentialsEvents = findEventsByName(sortedEvents, [
    "SUBMIT_CREDENTIALS",
  ]);
  if (submitCredentialsEvents.length > 0) {
    const submitCredentialsEvent =
      submitCredentialsEvents[submitCredentialsEvents.length - 1]; // Use latest SUBMIT_CREDENTIALS
    const mfaTransition = findNextEvent(
      sortedEvents,
      submitCredentialsEvent.timestamp,
      ["TRANSITION_VIEW"],
      "MFA",
    );

    if (mfaTransition) {
      const segmentDuration =
        new Date(mfaTransition.timestamp).getTime() -
        new Date(submitCredentialsEvent.timestamp).getTime();
      totalDuration += segmentDuration;
    }
  }

  // Segment 3b: SUBMIT_MFA to SELECT_ACCOUNT transition (after user MFA interaction)
  const submitMfaEvents = findEventsByName(sortedEvents, ["SUBMIT_MFA"]);
  if (submitMfaEvents.length > 0) {
    const submitMfaEvent = submitMfaEvents[submitMfaEvents.length - 1]; // Use latest SUBMIT_MFA
    const selectAccountTransition = findNextEvent(
      sortedEvents,
      submitMfaEvent.timestamp,
      ["TRANSITION_VIEW"],
      "SELECT_ACCOUNT",
    );

    if (selectAccountTransition) {
      const segmentDuration =
        new Date(selectAccountTransition.timestamp).getTime() -
        new Date(submitMfaEvent.timestamp).getTime();
      totalDuration += segmentDuration;
    }
  }

  // Segment 3c: SUBMIT_CREDENTIALS to SELECT_ACCOUNT transition (when no MFA required)
  if (submitCredentialsEvents.length > 0) {
    const submitCredentialsEvent =
      submitCredentialsEvents[submitCredentialsEvents.length - 1];
    // Only calculate this segment if there's no MFA flow
    const hasMfaFlow =
      findEventsByName(sortedEvents, ["TRANSITION_VIEW"], "MFA").length > 0;

    if (!hasMfaFlow) {
      const selectAccountTransition = findNextEvent(
        sortedEvents,
        submitCredentialsEvent.timestamp,
        ["TRANSITION_VIEW"],
        "SELECT_ACCOUNT",
      );

      if (selectAccountTransition) {
        const segmentDuration =
          new Date(selectAccountTransition.timestamp).getTime() -
          new Date(submitCredentialsEvent.timestamp).getTime();
        totalDuration += segmentDuration;
      }
    }
  }

  // Segment 4: CONNECTED transition to next SUBMIT_PHONE transition (excluding user interaction time)
  const connectedTransitions = findEventsByName(
    sortedEvents,
    ["TRANSITION_VIEW"],
    "CONNECTED",
  );
  if (connectedTransitions.length > 0) {
    const connectedTransition = connectedTransitions[0];
    const nextPhoneTransition = findNextEvent(
      sortedEvents,
      connectedTransition.timestamp,
      ["TRANSITION_VIEW"],
      "SUBMIT_PHONE",
    );

    if (nextPhoneTransition) {
      const segmentDuration =
        new Date(nextPhoneTransition.timestamp).getTime() -
        new Date(connectedTransition.timestamp).getTime();
      totalDuration += segmentDuration;
    }
  }

  // Segment 5: Final SUBMIT_PHONE/SKIP_SUBMIT_PHONE to HANDOFF (or successAt if no HANDOFF)
  const finalPhoneEvents = findEventsByName(sortedEvents, [
    "SKIP_SUBMIT_PHONE",
    "SUBMIT_PHONE",
  ]);
  if (finalPhoneEvents.length > 1) {
    // Use the last phone event (there might be multiple due to errors/retries)
    const finalPhoneEvent = finalPhoneEvents[finalPhoneEvents.length - 1];
    const handoffEvent = findNextEvent(
      sortedEvents,
      finalPhoneEvent.timestamp,
      ["HANDOFF"],
    );

    if (handoffEvent) {
      const segmentDuration =
        new Date(handoffEvent.timestamp).getTime() -
        new Date(finalPhoneEvent.timestamp).getTime();
      totalDuration += segmentDuration;
    } else if (successAt) {
      const segmentDuration =
        new Date(successAt).getTime() -
        new Date(finalPhoneEvent.timestamp).getTime();
      totalDuration += segmentDuration;
    }
  }

  return totalDuration > 0 ? totalDuration : null;
}

function calculateOAuthFlowDuration(
  events: WebhookEvent[],
  successAt?: string,
): number | null {
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  let totalDuration = 0;

  // Segment 1: SKIP_SUBMIT_PHONE/SUBMIT_PHONE to SELECT_INSTITUTION transition
  const phoneEvents = findEventsByName(sortedEvents, [
    "SKIP_SUBMIT_PHONE",
    "SUBMIT_PHONE",
  ]);
  if (phoneEvents.length > 0) {
    const phoneEvent = phoneEvents[0];
    const selectInstitutionTransition = findNextEvent(
      sortedEvents,
      phoneEvent.timestamp,
      ["TRANSITION_VIEW"],
      "SELECT_INSTITUTION",
    );

    if (selectInstitutionTransition) {
      const segmentDuration =
        new Date(selectInstitutionTransition.timestamp).getTime() -
        new Date(phoneEvent.timestamp).getTime();
      totalDuration += segmentDuration;
    }
  }

  // Segment 2: SELECT_INSTITUTION event to OAUTH transition
  const selectInstitutionEvents = findEventsByName(sortedEvents, [
    "SELECT_INSTITUTION",
  ]);
  if (selectInstitutionEvents.length > 0) {
    const selectInstitutionEvent = selectInstitutionEvents[0];
    const oauthTransition = findNextEvent(
      sortedEvents,
      selectInstitutionEvent.timestamp,
      ["TRANSITION_VIEW"],
      "OAUTH",
    );

    if (oauthTransition) {
      const segmentDuration =
        new Date(oauthTransition.timestamp).getTime() -
        new Date(selectInstitutionEvent.timestamp).getTime();
      totalDuration += segmentDuration;
    }
  }

  // Segment 3: Final SUBMIT_PHONE/SKIP_SUBMIT_PHONE to HANDOFF (or successAt if no HANDOFF)
  const finalPhoneEvents = findEventsByName(sortedEvents, [
    "SKIP_SUBMIT_PHONE",
    "SUBMIT_PHONE",
  ]);
  if (finalPhoneEvents.length > 1) {
    const finalPhoneEvent = finalPhoneEvents[finalPhoneEvents.length - 1];
    const handoffEvent = findNextEvent(
      sortedEvents,
      finalPhoneEvent.timestamp,
      ["HANDOFF"],
    );

    if (handoffEvent) {
      const segmentDuration =
        new Date(handoffEvent.timestamp).getTime() -
        new Date(finalPhoneEvent.timestamp).getTime();
      totalDuration += segmentDuration;
    } else if (successAt) {
      const segmentDuration =
        new Date(successAt).getTime() -
        new Date(finalPhoneEvent.timestamp).getTime();
      totalDuration += segmentDuration;
    }
  }

  return totalDuration > 0 ? totalDuration : null;
}

export function calculateDurationFromEvents(
  events: WebhookEvent[],
  successAt?: string,
): number | null {
  const isOAuth = isOAuthFlow(events);

  if (isOAuth) {
    return calculateOAuthFlowDuration(events, successAt);
  } else {
    return calculateCredentialFlowDuration(events, successAt);
  }
}
