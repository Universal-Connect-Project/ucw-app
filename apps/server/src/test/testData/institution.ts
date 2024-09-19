import {
  TEST_EXAMPLE_A_AGGREGATOR_STRING,
  TEST_EXAMPLE_B_AGGREGATOR_STRING
} from '../../test-adapter'
import type { CachedInstitution } from '../../shared/contract'

export const institutionData = {
  institution: {
    code: 'testCode',
    medium_logo_url: 'mediumLogoUrl',
    name: 'testName',
    small_logo_url: 'smallLogoUrl',
    supports_oauth: true,
    url: 'testUrl'
  }
}

export const sophtronInstitutionData = {
  InstitutionID: 'institutionId',
  Logo: 'Logo',
  InstitutionName: 'institutionName',
  URL: 'url'
}

export const sophtronUserInstitutionAccountsData = [
  {
    AccountName: 'AccountName',
    AccountNumber: 'AccountNumber',
    AccountID: 'AccountID'
  }
]

export const finicityInsitutionData = {
  institution: {
    id: 'testId',
    name: 'FinBank',
    voa: true,
    voi: true,
    stateAgg: true,
    ach: true,
    transAgg: true,
    aha: false,
    availBalance: false,
    accountOwner: true,
    loanPaymentDetails: false,
    studentLoanData: false,
    accountTypeDescription: 'Fake',
    phone: '',
    urlHomeApp: 'https://finbank.prod.fini.city/CCBankImageMFA/login.jsp',
    urlLogonApp: 'https://finbank.prod.fini.city/CCBankImageMFA/login.jsp',
    oauthEnabled: false,
    urlForgotPassword: 'https://developer.mastercard.com/forgot-password',
    urlOnlineRegistration: 'https://www.finicity.com/signup/',
    class: 'testfi',
    specialText:
      'Please enter your FinBank Username and Password required for login.',
    address: {
      city: 'Utah',
      state: '',
      country: 'USA',
      postalCode: '',
      addressLine1: '',
      addressLine2: ''
    },
    currency: 'USD',
    email: 'finbank.ds5@finicity.com',
    status: 'online',
    branding: {
      logo: 'https://prod-carpintero-branding.s3.us-west-2.amazonaws.com/101732/logo.svg',
      alternateLogo:
        'https://prod-carpintero-branding.s3.us-west-2.amazonaws.com/101732/alternateLogo.svg',
      icon: 'https://prod-carpintero-branding.s3.us-west-2.amazonaws.com/101732/icon.svg',
      primaryColor: '#1B3E4A',
      tile: 'https://prod-carpintero-branding.s3.us-west-2.amazonaws.com/101732/tile.svg'
    },
    productionStatus: {
      overallStatus: 'online',
      transAgg: 'online',
      voa: 'online',
      voi: 'online',
      stateAgg: 'online',
      ach: 'online',
      aha: 'online'
    }
  }
}

export const elasticSearchInstitutionData: CachedInstitution = {
  name: 'MX Bank (Oauth)',
  keywords: 'Gringotts, MX Bank, oauth',
  logo: 'https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
  url: 'https://mx.com',
  ucp_id: 'UCP-da107e6d0da7779',
  is_test_bank: true,
  routing_numbers: ['1234567'],
  mx: {
    id: 'INS-68e96dd6-eabd-42d3-9f05-416897f0746c',
    supports_aggregation: true,
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_history: false
  },
  sophtron: {
    id: null,
    supports_aggregation: false,
    supports_oauth: false,
    supports_identification: false,
    supports_verification: false,
    supports_history: false
  },
  [TEST_EXAMPLE_A_AGGREGATOR_STRING]: {
    id: 'aId',
    supports_aggregation: true,
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_history: false
  },
  [TEST_EXAMPLE_B_AGGREGATOR_STRING]: {
    id: 'bId',
    supports_aggregation: true,
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_history: false
  }
}

export const transformedInstitutionList = [
  {
    guid: 'UCP-da107e6d0da7779',
    name: 'MX Bank (Oauth)',
    url: 'https://mx.com',
    logo_url:
      'https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
    supports_oauth: true
  },
  {
    guid: 'UCP-da107e6d0da7779',
    name: 'MX Bank (Oauth)',
    url: 'https://mx.com',
    logo_url:
      'https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
    supports_oauth: true
  }
]

export const transformedPopularInstitutionsList = [
  {
    guid: 'UCP-da107e6d0da7779',
    name: 'MX Bank (Oauth)',
    url: 'https://mx.com',
    logo_url:
      'https://s3.amazonaws.com/MD_Assets/Ipad%20Logos/100x100/INS-3aeb38da-26e4-3818-e0fa-673315ab7754_100x100.png',
    supports_oauth: true
  }
]
