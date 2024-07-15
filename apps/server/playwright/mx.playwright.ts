import { expect, test } from '@playwright/test'

test('connects to mx bank with oAuth', async ({ page }) => {
  test.setTimeout(60000)

  const userId = crypto.randomUUID()

  await page.goto(`http://localhost:8080/?job_type=aggregate&user_id=${userId}`)

  await page.getByPlaceholder('Search').fill('MX Bank (Oauth)')

  await page.getByLabel('Add account with MX Bank (Oauth)').click()

  const popupPromise = page.waitForEvent('popup')

  await page.getByRole('link', { name: 'Continue' }).click()

  const authorizeTab = await popupPromise
  await authorizeTab.getByRole('button', { name: 'Authorize' }).click()
  await expect(
    authorizeTab.getByText('Thank you for completing OAuth.')
  ).toBeVisible()

  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible({
    timeout: 60000
  })

  const apiRequest = page.context().request
  await apiRequest.delete(
    `http://localhost:8080/user/${userId}?provider=mx_int`
  )
})
