import type { Response } from 'express'
import { HttpResponse, http } from 'msw'
import { MX_DELETE_USER_PATH } from '../test/handlers'
import { listUsersData } from '../test/testData/users'
import { server } from '../test/testServer'
import type { UserDeleteRequest } from './userEndpoints'
import { userDeleteHandler } from './userEndpoints'

const user = listUsersData.users[0]

describe('userEndpoints', () => {
  describe('userDeleteHandler', () => {
    it('responds with 204 on success with mx', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: UserDeleteRequest = {
        query: {
          provider: 'mx'
        },
        params: {
          userId: user.id
        }
      }

      await userDeleteHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('')
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(204)
    })

    it('responds with failure response returned from provider api', async () => {
      server.use(
        http.delete(
          MX_DELETE_USER_PATH,
          () => new HttpResponse(null, { status: 400 })
        )
      )

      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: UserDeleteRequest = {
        query: {
          provider: 'mx'
        },
        params: {
          userId: user.id
        }
      }

      await userDeleteHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('')
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('responds with a 400 on error', async () => {
      const res = {
        send: jest.fn(),
        status: jest.fn()
      } as unknown as Response

      const req: UserDeleteRequest = {
        query: {
          provider: 'akoya'
        },
        params: {
          userId: 'testUserIdWhichDoesntExist'
        }
      }

      await userDeleteHandler(req, res)

      expect(res.send).toHaveBeenCalledWith('User delete failed')
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
