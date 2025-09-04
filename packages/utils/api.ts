export const INSTRUMENTATION_URL = "/instrumentation";

export const OAUTH_START_URL = "/performance/oAuthStart";

export const INSTRUMENTATION_MOCK_URL = `${INSTRUMENTATION_URL}/userId/:userId`;

export const MEMBERS_URL = "/members";

export const SEARCH_INSTITUTIONS_URL = "/institutions";
export const RECOMMENDED_INSTITUTIONS_URL = "/institutions/recommended";

export const INSTITUTION_CREDENTIALS_MOCK_URL = `/institutions/:guid/credentials`;
export const INSTITUTION_BY_GUID_MOCK_URL = `/institutions/:guid`;
export const MEMBER_CREDENTIALS_MOCK_URL = "/members/:guid/credentials";

export const MEMBER_BY_GUID_MOCK_URL = "/members/:guid";

export const UPDATE_MFA_MOCK_URL = "/members/:guid";

export const OAUTH_STATES_URL = "/oauthStates";
export const OAUTH_STATE_MOCK_URL = `${OAUTH_STATES_URL}/:connectionId`;

export const JOB_BY_GUID_MOCK_URL = `/jobs/:guid`;

export const CREATE_MEMBER_URL = "/members";

export const getDefaultTransactionRequestStartDate = (): Date => {
  const now = new Date();
  return new Date(now.setDate(now.getDate() - 120));
};

export const getDefaultTransactionRequestEndDate = (): Date => {
  const now = new Date();
  return new Date(now.setDate(now.getDate() + 5));
};

type DateRangeParams = {
  startDate?: string;
  endDate?: string;
  validDatePattern?: RegExp;
  defaultEndOverride?: Date;
};

export const getPreparedDateRangeParams = ({
  startDate,
  endDate,
  validDatePattern = /^\d{4}-\d{2}-\d{2}$/,
  defaultEndOverride,
}: DateRangeParams): { preparedStartDate: Date; preparedEndDate: Date } => {
  let preparedStartDate: Date;
  let preparedEndDate: Date;

  if (startDate) {
    const date = new Date(startDate);
    if (!isNaN(date.getTime()) && validDatePattern.test(startDate)) {
      preparedStartDate = date;
    } else {
      throw new Error("startDate must be a valid ISO 8601 date string");
    }
  } else {
    preparedStartDate = getDefaultTransactionRequestStartDate();
  }

  if (endDate) {
    const date = new Date(endDate);
    if (!isNaN(date.getTime()) && validDatePattern.test(endDate)) {
      preparedEndDate = date;
    } else {
      throw new Error("endDate must be a valid ISO 8601 date string");
    }
  } else if (defaultEndOverride) {
    preparedEndDate = defaultEndOverride;
  } else {
    preparedEndDate = getDefaultTransactionRequestEndDate();
  }

  return {
    preparedStartDate,
    preparedEndDate,
  };
};
