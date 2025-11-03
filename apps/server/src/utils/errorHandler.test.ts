import { mock } from "jest-mock-extended";
import handleError from "./errorHandler";
import type { Response } from "express";
import {
  SOMETHING_WENT_WRONG_ERROR_TEXT,
  USER_NOT_RESOLVED_ERROR_TEXT,
} from "@repo/utils";

describe("handleError", () => {
  const mockResponse = mock<Response>();

  beforeEach(() => {
    mockResponse.status.mockReturnThis();
    mockResponse.json.mockReset();
  });

  it("should return 404 with USER_NOT_RESOLVED_ERROR_TEXT when the error message matches", () => {
    const error = {
      name: "Error",
      message: USER_NOT_RESOLVED_ERROR_TEXT,
      cause: {},
    };

    handleError({ error, res: mockResponse });

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: USER_NOT_RESOLVED_ERROR_TEXT,
    });
  });

  it("should return the status code from error.status if provided", () => {
    const error = {
      name: "Error",
      message: "Custom error message",
      status: 500,
    };

    handleError({ error, res: mockResponse });

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Custom error message",
    });
  });

  it("should return the status code from error.cause if provided and no error.status", () => {
    const error = {
      name: "Error",
      message: "Custom error message",
      cause: { statusCode: 500 },
    };

    handleError({ error, res: mockResponse });

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Custom error message",
    });
  });

  it("should prioritize error.cause.statusCode over error.status", () => {
    const error = {
      name: "Error",
      message: "Custom error message",
      status: 422,
      cause: { statusCode: 500 },
    };

    handleError({ error, res: mockResponse });

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Custom error message",
    });
  });

  it("should return 400 with the error message if no statusCode is provided in error.cause", () => {
    const error = {
      name: "Error",
      message: "Another custom error message",
      cause: {},
    };

    handleError({ error, res: mockResponse });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: "Another custom error message",
    });
  });

  it("should return 400 with SOMETHING_WENT_WRONG_ERROR_TEXT if no error message is provided", () => {
    const error: { name: string; message: string | undefined; cause: object } =
      {
        name: "Error",
        message: undefined,
        cause: {},
      };

    handleError({ error, res: mockResponse });

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: SOMETHING_WENT_WRONG_ERROR_TEXT,
    });
  });
});
