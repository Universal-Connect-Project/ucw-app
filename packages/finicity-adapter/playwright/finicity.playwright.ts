// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { expect, test } from "@playwright/test";
import * as fs from 'fs';
import dotenv from "dotenv";
import path from 'path';

const dir = path.resolve(__dirname, '../../../apps/server/.env')
dotenv.config({ path: dir });

let authorizeTab;

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshotPath = testInfo.outputPath(`failure.png`);
    testInfo.attachments.push({ name: 'screenshot', path: screenshotPath, contentType: 'image/png' });
    if(authorizeTab){
      await authorizeTab.screenshot({ path: screenshotPath, timeout: 5000 });
      const html = await authorizeTab.content()
      const htmlPath = testInfo.outputPath(`failure.html`);
      fs.writeFileSync(htmlPath, html);
    }else{
      await page.screenshot({ path: screenshotPath, timeout: 5000 });
    }
  }
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
test("connects to finbank bank with oAuth", async ({ page, request }) => {
// test("connects to finbank bank with oAuth", async ({ page }) => {
  test.setTimeout(300000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?jobTypes=transactions&userId=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("finbank");

  await page.getByLabel("Add account with FinBank Profiles - A").click();

  page.evaluate(`
      window.addEventListener('message', (event) => {
          const message = event.data
          console.log({message})
    })
  `)
  // const popupPromise = page.waitForEvent("popup");
  // await page.getByRole("link", { name: "Go to log in" }).click();

  // authorizeTab = await popupPromise;

  // await authorizeTab.locator("button.continue-btn").click();

  // await authorizeTab.locator("input[type='text']").fill('sue_wealthy');
  // await authorizeTab.locator("input[type='password']").fill('profile_700');
  // await authorizeTab.locator("button.sign-in").click();

  // await expect(page.getByRole("button", { name: "Continue" })).toBeVisible({
  //   timeout: 120000,
  // });

  // const connectedPromise = new Promise((resolve, reject) => {
  //   const timer = setTimeout(() => reject('timed out'), 120000);
  //   page.on("console", async (msg : any) => {
  //     const obj = (await msg.args()[0].jsonValue())?.message
  //     if(obj?.type === 'connect/memberConnected'){
  //       await testDataEndpoints(userId, request, obj.metadata)
  //       clearTimeout(timer)
  //       resolve('');
  //     }
  //   })
  // })

  // await connectedPromise;

  // const apiRequest = page.context().request;
  // await apiRequest.delete(
  //   `http://localhost:8080/api/aggregator/finicity_sandbox/user/${userId}`,
  // );
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function testDataEndpoints (request, userId, event){
  const widgetDemoDataAccessToken = process.env.WIDGET_DEMO_DATA_ACCESS_TOKEN_ENV;
  const { member_guid, aggregator } = event
  let accountId;
  let url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${userId}/connection/${member_guid}/accounts`
  await request.get(url, {
    headers: {
      authorization: `Bearer ${widgetDemoDataAccessToken}`,
    },
  }).then(async (response) => {
    const text = await response.text()
    const accounts = JSON.parse(text)
    expect(accounts?.accounts?.length).toBeGreaterThanOrEqual(1)
    const account = accounts.accounts[0];
    console.log(account)
    accountId = account[Object.keys(account)[0]].accountId
    console.log(`Found account Id: ${accountId}`)
  });
  expect(accountId).not.toBeNull()
  url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${userId}/connection/${accountId}/identity`
  await request.get(url, {
    headers: {
      authorization: `Bearer ${widgetDemoDataAccessToken}`,
    },
  }).then(async (response) => {
    const text = await response.text()
    const customers = JSON.parse(text)
    console.log(customers)
    expect(customers?.customers?.length).toBeGreaterThanOrEqual(1)
  });
  const end = new Date()
  const start = new Date(new Date().setFullYear(end.getFullYear() - 1));
  url = `http://localhost:8080/api/data/aggregator/${aggregator}/user/${userId}/account/${accountId}/transactions?connectionId=${member_guid}&start_time=${start}&end_time=${end}`
  await request.get(url, {
    headers: {
      authorization: `Bearer ${widgetDemoDataAccessToken}`,
    },
  }).then(async (response) => {
    const text = await response.text()
    const trans = JSON.parse(text)
    console.log(trans)
    expect(trans?.transactions?.length).toBeGreaterThanOrEqual(0)
  });
}