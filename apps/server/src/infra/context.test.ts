import { contextHandler } from "./context"

describe("context", () => {
  describe("contextHandler", () => {
    it("sets the request context and response context to an empty object if there are no meta headers", () => {
      const req = {
        headers: {},
      } as any
      const res = {} as any
      const next = jest.fn()
      contextHandler(req, res, next)

      expect(req.context).toEqual({})
      expect(res.context).toEqual({})
    })

    it("sets the req and res context to the meta headers, sets updated to false, and doesn't set the res meta if there are headers", () => {
      const testMetaObject = {
        test: "test",
      }

      const req = {
        headers: {
          meta: JSON.stringify(testMetaObject),
        },
      } as any
      const res = {} as any
      const next = jest.fn()
      contextHandler(req, res, next)

      expect(req.context).toEqual(testMetaObject)
      expect(res.context).toEqual(testMetaObject)
    })
  })
})
