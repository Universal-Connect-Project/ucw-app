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
    specialText: 'Please enter your FinBank Username and Password required for login.',
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
      alternateLogo: 'https://prod-carpintero-branding.s3.us-west-2.amazonaws.com/101732/alternateLogo.svg',
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
