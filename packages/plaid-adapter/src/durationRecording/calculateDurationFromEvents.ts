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

const isOAuthFlow = (events: WebhookEvent[]): boolean => {
  return events.some((event) => event.event_name === "OPEN_OAUTH");
};

const getTimeFromEvent = (event: WebhookEvent): number => {
  return new Date(event.timestamp).getTime();
};

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

const findNextEvent = ({
  events,
  afterTimestamp,
  eventNames,
  viewName,
}: {
  events: WebhookEvent[];
  afterTimestamp: string;
  eventNames: string[];
  viewName?: string;
}): WebhookEvent | null => {
  const afterTime = new Date(afterTimestamp).getTime();
  const matchingEvents = events.filter(
    (event) =>
      eventNames.includes(event.event_name) &&
      (!viewName || event.event_metadata.view_name === viewName) &&
      getTimeFromEvent(event) > afterTime,
  );

  return matchingEvents.length > 0 ? matchingEvents[0] : null;
};

const addSegmentDuration = ({
  fromEvents,
  toEventConfig,
  sortedEvents,
  useLastFromEvent = false,
}: {
  fromEvents: WebhookEvent[];
  toEventConfig: {
    eventNames: string[];
    viewName?: string;
  };
  sortedEvents: WebhookEvent[];
  useLastFromEvent?: boolean;
}): number => {
  if (!fromEvents.length) return 0;

  const fromEvent = useLastFromEvent
    ? fromEvents[fromEvents.length - 1]
    : fromEvents[0];
  const toEvent = findNextEvent({
    events: sortedEvents,
    afterTimestamp: fromEvent.timestamp,
    eventNames: toEventConfig.eventNames,
    viewName: toEventConfig.viewName,
  });

  if (!toEvent) return 0;

  return getTimeFromEvent(toEvent) - getTimeFromEvent(fromEvent);
};

function calculateCredentialFlowDuration(
  events: WebhookEvent[],
  successAt?: string,
): number | null {
  // Sort events by timestamp for chronological processing
  const sortedEvents = [...events].sort(
    (a, b) => getTimeFromEvent(a) - getTimeFromEvent(b),
  );

  let totalDuration = 0;

  // Segment 1: SKIP_SUBMIT_PHONE/SUBMIT_PHONE to SELECT_INSTITUTION transition
  const phoneEvents = findEventsByName(sortedEvents, [
    "SKIP_SUBMIT_PHONE",
    "SUBMIT_PHONE",
  ]);
  totalDuration += addSegmentDuration({
    fromEvents: phoneEvents,
    toEventConfig: {
      eventNames: ["TRANSITION_VIEW"],
      viewName: "SELECT_INSTITUTION",
    },
    sortedEvents,
  });

  // Segment 2: SELECT_INSTITUTION event to CREDENTIAL transition
  const selectInstitutionEvents = findEventsByName(sortedEvents, [
    "SELECT_INSTITUTION",
  ]);
  totalDuration += addSegmentDuration({
    fromEvents: selectInstitutionEvents,
    toEventConfig: {
      eventNames: ["TRANSITION_VIEW"],
      viewName: "CREDENTIAL",
    },
    sortedEvents,
  });

  // Segment 3a: SUBMIT_CREDENTIALS to MFA transition (when MFA is required)
  const submitCredentialsEvents = findEventsByName(sortedEvents, [
    "SUBMIT_CREDENTIALS",
  ]);
  totalDuration += addSegmentDuration({
    fromEvents: submitCredentialsEvents,
    toEventConfig: {
      eventNames: ["TRANSITION_VIEW"],
      viewName: "MFA",
    },
    sortedEvents,
    useLastFromEvent: true, // Use latest SUBMIT_CREDENTIALS
  });

  // Segment 3b: SUBMIT_MFA to SELECT_ACCOUNT transition (after user MFA interaction)
  const submitMfaEvents = findEventsByName(sortedEvents, ["SUBMIT_MFA"]);
  totalDuration += addSegmentDuration({
    fromEvents: submitMfaEvents,
    toEventConfig: {
      eventNames: ["TRANSITION_VIEW"],
      viewName: "SELECT_ACCOUNT",
    },
    sortedEvents,
    useLastFromEvent: true, // Use latest SUBMIT_MFA
  });

  // Segment 3c: SUBMIT_CREDENTIALS to SELECT_ACCOUNT transition (when no MFA required)
  const hasMfaFlow =
    findEventsByName(sortedEvents, ["TRANSITION_VIEW"], "MFA").length > 0;

  if (!hasMfaFlow) {
    totalDuration += addSegmentDuration({
      fromEvents: submitCredentialsEvents,
      toEventConfig: {
        eventNames: ["TRANSITION_VIEW"],
        viewName: "SELECT_ACCOUNT",
      },
      sortedEvents,
      useLastFromEvent: true,
    });
  }

  // Segment 4: CONNECTED transition to next SUBMIT_PHONE transition (excluding user interaction time)
  const connectedTransitions = findEventsByName(
    sortedEvents,
    ["TRANSITION_VIEW"],
    "CONNECTED",
  );
  totalDuration += addSegmentDuration({
    fromEvents: connectedTransitions,
    toEventConfig: {
      eventNames: ["TRANSITION_VIEW"],
      viewName: "SUBMIT_PHONE",
    },
    sortedEvents,
  });

  // Segment 5: Final SUBMIT_PHONE/SKIP_SUBMIT_PHONE to HANDOFF (or successAt if no HANDOFF)
  const finalPhoneEvents = findEventsByName(sortedEvents, [
    "SKIP_SUBMIT_PHONE",
    "SUBMIT_PHONE",
  ]);
  if (finalPhoneEvents.length > 1) {
    // Try to use HANDOFF first
    const handoffDuration = addSegmentDuration({
      fromEvents: finalPhoneEvents,
      toEventConfig: {
        eventNames: ["HANDOFF"],
      },
      sortedEvents,
      useLastFromEvent: true, // Use the last phone event
    });

    if (handoffDuration > 0) {
      totalDuration += handoffDuration;
    } else if (successAt) {
      // Fallback to successAt if no HANDOFF
      const finalPhoneEvent = finalPhoneEvents[finalPhoneEvents.length - 1];
      const segmentDuration =
        new Date(successAt).getTime() - getTimeFromEvent(finalPhoneEvent);
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
    (a, b) => getTimeFromEvent(a) - getTimeFromEvent(b),
  );

  let totalDuration = 0;

  // Segment 1: SKIP_SUBMIT_PHONE/SUBMIT_PHONE to SELECT_INSTITUTION transition
  const phoneEvents = findEventsByName(sortedEvents, [
    "SKIP_SUBMIT_PHONE",
    "SUBMIT_PHONE",
  ]);
  totalDuration += addSegmentDuration({
    fromEvents: phoneEvents,
    toEventConfig: {
      eventNames: ["TRANSITION_VIEW"],
      viewName: "SELECT_INSTITUTION",
    },
    sortedEvents,
  });

  // Segment 2: SELECT_INSTITUTION event to OAUTH transition
  const selectInstitutionEvents = findEventsByName(sortedEvents, [
    "SELECT_INSTITUTION",
  ]);
  totalDuration += addSegmentDuration({
    fromEvents: selectInstitutionEvents,
    toEventConfig: {
      eventNames: ["TRANSITION_VIEW"],
      viewName: "OAUTH",
    },
    sortedEvents,
  });

  // Segment 3: Final SUBMIT_PHONE/SKIP_SUBMIT_PHONE to HANDOFF (or successAt if no HANDOFF)
  const finalPhoneEvents = findEventsByName(sortedEvents, [
    "SKIP_SUBMIT_PHONE",
    "SUBMIT_PHONE",
  ]);
  if (finalPhoneEvents.length > 1) {
    // Try to use HANDOFF first
    const handoffDuration = addSegmentDuration({
      fromEvents: finalPhoneEvents,
      toEventConfig: {
        eventNames: ["HANDOFF"],
      },
      sortedEvents,
      useLastFromEvent: true, // Use the last phone event
    });

    if (handoffDuration > 0) {
      totalDuration += handoffDuration;
    } else if (successAt) {
      // Fallback to successAt if no HANDOFF
      const finalPhoneEvent = finalPhoneEvents[finalPhoneEvents.length - 1];
      const segmentDuration =
        new Date(successAt).getTime() - getTimeFromEvent(finalPhoneEvent);
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
