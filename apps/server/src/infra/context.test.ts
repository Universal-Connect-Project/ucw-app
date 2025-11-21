/* eslint-disable @typescript-eslint/no-explicit-any */
import { contextHandler } from "./context";

describe("context", () => {
  describe("contextHandler", () => {
    it("sets the request context and response context to an empty object if there are no meta headers", () => {
      const req = {
        headers: {},
      } as any;
      const res = {} as any;
      const next = jest.fn();
      contextHandler(req, res, next);

      expect(req.context).toEqual({});
      expect(res.context).toEqual({});
    });

    it("sets the req and res context to the meta headers and doesn't set the res meta if there are headers", () => {
      const testMetaObject = {
        test: "test",
      };

      const req = {
        headers: {
          meta: JSON.stringify(testMetaObject),
        },
      } as any;
      const res = {} as any;
      const next = jest.fn();
      contextHandler(req, res, next);

      const contextObject = {
        ...testMetaObject,
      };

      expect(req.context).toEqual(contextObject);
      expect(res.context).toEqual(contextObject);
    });

    it("sets the meta on json and calls the original json function", () => {
      const req = {
        headers: {},
      } as any;

      const res = {
        json: jest.fn(),
        set: jest.fn(),
      } as any;

      const next = jest.fn();
      contextHandler(req, res, next);

      expect(res.context).toEqual({});

      res.json("1", "2");

      expect(res.set).toHaveBeenCalledWith("meta", JSON.stringify(res.context));

      expect(res.json).toHaveBeenCalledWith("1", "2");
    });
  });
});
