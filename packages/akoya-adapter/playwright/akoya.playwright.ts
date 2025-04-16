import { expect, test } from "@playwright/test";
import { ComboJobTypes } from "@repo/utils";
import AkoyaClient from '../src/apiClient';
import dotenv from "dotenv";
import path from 'path';

const dir = path.resolve(__dirname, '../../../apps/server/.env')
dotenv.config({ path: dir });

const widgetDemoDataAccessToken = process.env.WIDGET_DEMO_DATA_ACCESS_TOKEN_ENV;
const aggregatorCredentials = {
  clientId: process.env.AKOYA_CLIENT_ID,
  secret: process.env.AKOYA_SECRET
}
const apiClient = new AkoyaClient(true, aggregatorCredentials, {error: console.log} as any, { HostUrl: process.env.HOST_URL } as any)
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    // Get a unique place for the screenshot.
    const screenshotPath = testInfo.outputPath(`failure.png`);
    // Add it to the report.
    testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
    // Take the screenshot itself.
    await page.screenshot({ path: screenshotPath, timeout: 5000 });
  }
});
test("connects to mikomo bank with oAuth", async ({ page, request }, testInfo) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
  );

  page.evaluate(`
      window.addEventListener('message', (event) => {
          const message = event.data
          console.log({message})
    })
  `)

  await page.getByPlaceholder("Search").fill("mikomo bank");

  await page.getByLabel("Add account with Mikomo Bank").click();
  
  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Go to log in" }).click();

  const authorizeTab = await popupPromise;
  const url = await authorizeTab.url()
  console.log('popup => ' + url);
  const screenshotPath = testInfo.outputPath(`popup_login.png`);
  await authorizeTab.screenshot({ path: screenshotPath, timeout: 5000 });
  await authorizeTab.locator("input[type='text']").fill('mikomo_1');
  await authorizeTab.locator("input[type='password']").fill('mikomo_1');
  await authorizeTab.locator("button[type='submit']").click();

  await expect(
    authorizeTab.locator("div.terms-disclaimer"),
  ).toBeVisible();

  await authorizeTab.locator("button[value='#accounts']" ).click();

  await expect(
    authorizeTab.locator("button[id='accounts-approve']"),
  ).toBeVisible();

  await authorizeTab.locator("label.form-check-label").last().click();
  await authorizeTab.locator("button[id='accounts-approve']").click();

  const connectedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject('timed out'), 12000);
    page.on("console", async (msg : any) => {
      const obj = (await msg.args()[0].jsonValue())?.message
      if(obj?.type === 'connect/memberConnected'){
        const { user_guid, member_guid, aggregator } = obj.metadata;
        const idToken = await apiClient.getIdToken(user_guid);
        const user = encodeURIComponent(JSON.stringify(idToken))
        let accountId;
        let url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${user}/connection/${member_guid}/accounts`
        await request.get(url, {
          headers: {
            authorization: `Bearer ${widgetDemoDataAccessToken}`,
          },
        }).then(async (response) => {
          const text = await response.text()
          const accounts = JSON.parse(text)
          expect(accounts?.accounts?.length).toBeGreaterThanOrEqual(1)
          const account = accounts.accounts[0];
          accountId = account[Object.keys(account)[0]].accountId
        });
        url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${user}/connection/${member_guid}/identity`
        await request.get(url, {
          headers: {
            authorization: `Bearer ${widgetDemoDataAccessToken}`,
          },
        }).then(async (response) => {
          const text = await response.text()
          const customers = JSON.parse(text)
          expect(customers?.customers?.length).toBeGreaterThanOrEqual(1)
        });
        expect(accountId).not.toBeNull()
        const end = new Date()
        const start = new Date(new Date().setFullYear(end.getFullYear() - 1));
        url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${user}/account/${accountId}/transactions?connectionId=${member_guid}&start_time=${start}&end_time=${end}`
        await request.get(url, {
          headers: {
            authorization: `Bearer ${widgetDemoDataAccessToken}`,
          },
        }).then(async (response) => {
          const text = await response.text()
          const trans = JSON.parse(text)
          expect(trans?.transactions?.length).toBeGreaterThanOrEqual(0)
        });
        clearTimeout(timer)
        resolve('');
      }
    })
  })

  await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
    timeout: 120000,
  });
  await connectedPromise;

  const apiRequest = page.context().request;
  await apiRequest.delete(
    `http://localhost:8080/api/aggregator/akoya_sandbox/user/${userId}`,
  );
});
