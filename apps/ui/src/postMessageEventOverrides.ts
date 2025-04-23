import isEqual from "lodash.isequal";

const postMessageEventOverrides = {
  memberConnected: {
    createEventData: ({
      institution,
      member,
    }: {
      institution: {
        ucpInstitutionId: string;
      };
      member: {
        postMessageEventData: {
          memberConnected: object;
        };
      };
    }) => {
      return {
        ucpInstitutionId: institution.ucpInstitutionId,
        ...member.postMessageEventData.memberConnected,
      };
    },
  },
  memberStatusUpdate: {
    createEventData: ({
      institution,
      member,
    }: {
      institution: {
        ucpInstitutionId: string;
      };
      member: {
        postMessageEventData: {
          memberStatusUpdate: object;
        };
      };
    }) => {
      return {
        ucpInstitutionId: institution.ucpInstitutionId,
        ...member.postMessageEventData.memberStatusUpdate,
      };
    },
    getHasStatusChanged: ({
      currentMember,
      previousMember,
    }: {
      currentMember: {
        postMessageEventData: {
          memberStatusUpdate: object;
        };
      };
      previousMember: {
        postMessageEventData: {
          memberStatusUpdate: object;
        };
      };
    }) =>
      !isEqual(
        currentMember?.postMessageEventData?.memberStatusUpdate,
        previousMember?.postMessageEventData?.memberStatusUpdate,
      ),
  },
};

export default postMessageEventOverrides;
