export const createMemberData = {
  MemberID: 'memberId',
  JobID: 'jobId'
}

export const updateMemberData = createMemberData

export const getMemberData = {
  ...createMemberData,
  InstitutionID: 'institutionId'
}
