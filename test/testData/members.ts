import { ConnectionStatus } from '../../shared/contract'

export const memberData = {
  member: {
    guid: 'testGuid1',
    institution_code: 'insitutionCode1',
    is_being_aggregated: false,
    is_oauth: false,
    oauth_window_uri: 'oauthWindowUri1'
  }
}

export const verifyMemberData = {
  ...memberData,
  member: {
    ...memberData.member,
    guid: 'verifyMemberGuid'
  }
}

export const identifyMemberData = {
  ...memberData,
  member: {
    ...memberData.member,
    guid: 'identifyMemberGuid'
  }
}

export const extendHistoryMemberData = {
  ...memberData,
  member: {
    ...memberData.member,
    guid: 'extendHistoryMemberGuid'
  }
}

export const aggregateMemberMemberData = {
  ...memberData,
  member: {
    ...memberData.member,
    guid: 'aggregateMemberMemberGuid'
  }
}

export const connectionByIdMemberData = {
  ...memberData,
  member: {
    ...memberData.member,
    guid: 'connectionByIdMemberGuid'
  }
}

export const membersData = {
  members: [memberData.member, {
    guid: 'testGuid2',
    institution_code: 'insitutionCode2',
    is_being_aggregated: false,
    is_oauth: false,
    oauth_window_uri: 'oauthWindowUri2'
  }]
}

export const memberStatusData = {
  member: {
    // challenges: undefined,
    connection_status: ConnectionStatus.CREATED,
    guid: 'memberStatusGuid'
  }
}
