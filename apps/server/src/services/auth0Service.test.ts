import { http, HttpResponse } from 'msw'
import config from '../config'
import * as logger from '../infra/logger'
import { server } from '../test/testServer'
import { getAccessToken, REDIS_AUTH_ACCESS_KEY } from './auth0Service'
import { set } from './storageClient/redis'

describe('getAccessToken', () => {
  it('should return cached access token if available', async () => {
    const cachedToken = 'cached-access-token'
    await set(REDIS_AUTH_ACCESS_KEY, cachedToken)

    const result = await getAccessToken()

    expect(result).toBe(cachedToken)
  })

  it('should fetch a new token and cache it if not cached', async () => {
    const mockAccessToken = 'new-access-token'
    const mockResponseJson = {
      access_token: mockAccessToken,
      expires_in: 3600
    }

    let createAccessTokenPayload: any = null

    server.use(
      http.post(config.Auth0TokenUrl, async ({ request }) => {
        createAccessTokenPayload = await request.json()

        return HttpResponse.json(mockResponseJson)
      })
    )

    const token = await getAccessToken()

    expect(createAccessTokenPayload).toEqual({
      grant_type: 'client_credentials',
      audience: 'ucp-widget-interactions',
      client_id: config.UCPClientId,
      client_secret: config.UCPClientSecret
    })

    expect(token).toBe(mockAccessToken)
  })

  it('should log a warning and return null when unauthorized', async () => {
    const warningLogSpy = jest.spyOn(logger, 'warning')

    server.use(
      http.post(config.Auth0TokenUrl, async ({ request }) => {
        return new HttpResponse(null, {
          status: 401,
          statusText: 'Unauthorized'
        })
      })
    )

    const token = await getAccessToken()

    expect(token).toBeNull()
    expect(warningLogSpy).toHaveBeenCalledWith(
      'Unauthorized to retrieve UCP access token'
    )
  })

  it('should handle 500 errors gracefully', async () => {
    server.use(
      http.post(config.Auth0TokenUrl, async ({ request }) => {
        return new HttpResponse(null, {
          status: 500,
          statusText: 'Server Error'
        })
      })
    )

    await expect(getAccessToken()).rejects.toThrow(
      new Error('Could not get UCP access token: Response not ok')
    )
  })

  it('should handle Bad Request errors gracefully', async () => {
    server.use(
      http.post(config.Auth0TokenUrl, async ({ request }) => {
        return new HttpResponse(null, {
          status: 400,
          statusText: 'Bad Request'
        })
      })
    )

    await expect(getAccessToken()).rejects.toThrow(
      new Error('Could not get UCP access token: Response not ok')
    )
  })
})
