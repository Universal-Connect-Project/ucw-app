export const USER_NOT_RESOLVED_ERROR_TEXT = "Can't resolve userId";
export const SOMETHING_WENT_WRONG_ERROR_TEXT = "Something went wrong";

interface CustomError extends Error {
  cause: {
    statusCode?: number;
  };
}

export const parseError = (
  error: CustomError,
): { statusCode: number; message: string } => {
  if (error.message === USER_NOT_RESOLVED_ERROR_TEXT) {
    return {
      statusCode: 404,
      message: USER_NOT_RESOLVED_ERROR_TEXT,
    };
  } else if (error.message) {
    return {
      statusCode: error.cause?.statusCode || 400,
      message: error.message,
    };
  } else {
    return {
      statusCode: 400,
      message: SOMETHING_WENT_WRONG_ERROR_TEXT,
    };
  }
};
