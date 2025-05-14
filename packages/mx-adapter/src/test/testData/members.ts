export const memberData = {
  member: {
    guid: "testGuid1",
    institution_code: "insitutionCode1",
    is_being_aggregated: false,
    is_oauth: false,
    oauth_window_uri: undefined,
  },
};

export const oauthMemberdata = {
  member: {
    guid: "oauthGuid",
    institution_code: "oauthInsitutionCode",
    is_being_aggregated: false,
    is_oauth: true,
    oauth_window_uri: "oauthWindowUri",
  },
};

export const connectionByIdMemberData = {
  ...memberData,
  member: {
    ...memberData.member,
    guid: "connectionByIdMemberGuid",
  },
};

export const membersData = {
  members: [
    memberData.member,
    {
      guid: "testGuid2",
      institution_code: "insitutionCode2",
      is_being_aggregated: false,
      is_oauth: false,
      oauth_window_uri: undefined,
    },
    oauthMemberdata.member,
  ],
};

export const memberStatusData = {
  member: {
    // challenges: undefined,
    connection_status: "CONNECTED",
    guid: "memberStatusGuid",
  },
};
