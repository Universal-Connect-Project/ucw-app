export const institutionCredentialsData = {
  credentials: [
    {
      guid: 'guid1',
      field_name: 'fieldName1',
      field_type: 'PASSWORD'
    },
    {
      guid: 'guid2',
      field_name: 'fieldName2',
      field_type: 'fieldType2'
    }
  ]
}

const [firstCredential, secondCredential] =
  institutionCredentialsData.credentials

export const transformedInstitutionCredentials = {
  credentials: [
    {
      ...firstCredential,
      id: firstCredential.guid,
      label: firstCredential.field_name,
      field_type: 1
    },
    {
      ...secondCredential,
      id: secondCredential.guid,
      label: secondCredential.field_name,
      field_type: 3
    }
  ]
}
