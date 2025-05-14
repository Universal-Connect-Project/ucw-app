import { expect, test } from "@playwright/test";
import { ComboJobTypes, SOMETHING_WENT_WRONG_ERROR_TEXT } from "@repo/utils";

test("connects to mx bank with oAuth then does refresh right after", async ({
  page,
  request,
}) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
  );

  page.evaluate(`
      window.addEventListener('message', (event) => {
        const message = event.data;
        console.log({ message });
      });
    `);

  await page.getByPlaceholder("Search").fill("MX Bank (Oauth)");

  await page.getByLabel("Add account with MX Bank (Oauth)").click();

  const popupPromise = page.waitForEvent("popup");

  await page.getByRole("link", { name: "Go to log in" }).click();

  const authorizeTab = await popupPromise;
  await authorizeTab.getByRole("button", { name: "Authorize" }).click();
  await expect(
    authorizeTab.getByText("Thank you for completing OAuth"),
  ).toBeVisible();

  const connectedPromise = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject("timed out"), 120000);

    page.on("console", async (msg) => {
      const obj = (await msg.args()[0].jsonValue())?.message;
      if (obj?.type === "connect/memberConnected") {
        clearTimeout(timer);
        expect(obj.metadata.user_guid).not.toBeNull();
        expect(obj.metadata.member_guid).not.toBeNull();
        expect(obj.metadata.aggregator).toEqual("mx_int");
        expect(obj.metadata.connectionId).not.toBeNull();

        const { member_guid, aggregator, ucpInstitutionId } = obj.metadata;

        await page.goto(
          `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}&aggregator=${aggregator}&institutionId=${ucpInstitutionId}&connectionId=${member_guid}`,
        );

        const popupPromise2 = page.waitForEvent("popup");
        await page.getByRole("link", { name: "Go to log in" }).click();

        const authorizeTab2 = await popupPromise2;
        await authorizeTab2.getByRole("button", { name: "Authorize" }).click();

        await expect(page.getByRole("button", { name: "Done" })).toBeVisible({
          timeout: 120000,
        });

        resolve();
      }
    });
  });

  await connectedPromise;

  await request.delete(
    `http://localhost:8080/api/aggregator/mx_int/user/${userId}`,
  );
});

test("shows an error page if you deny an mx bank oauth connection", async ({
  page,
}) => {
  test.setTimeout(240000);

  const userId = crypto.randomUUID();

  await page.goto(
    `http://localhost:8080/widget?jobTypes=${ComboJobTypes.TRANSACTIONS}&userId=${userId}`,
  );

  await page.getByPlaceholder("Search").fill("MX Bank (Oauth)");

  await page.getByLabel("Add account with MX Bank (Oauth)").click();

  const popupPromise = page.waitForEvent("popup");

  await page.getByRole("link", { name: "Go to log in" }).click();

  const authorizeTab = await popupPromise;
  await authorizeTab.getByRole("button", { name: "Deny" }).click();
  await expect(
    authorizeTab.getByText(SOMETHING_WENT_WRONG_ERROR_TEXT),
  ).toBeVisible();

  // When we fix the issue so that we can see an error state we need to check for it here

  const apiRequest = page.context().request;
  await apiRequest.delete(
    `http://localhost:8080/api/aggregator/mx_int/user/${userId}`,
  );
});
