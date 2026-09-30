const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");

describe("Vault Ventures Homepage Smoke Test", function () {
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments("--start-maximized");

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it("TC-01 should open Vault Ventures homepage successfully", async function () {
    await driver.get("http://localhost:8443/");

    await driver.wait(until.elementLocated(By.css("body")), 15000);
    await driver.sleep(3000);

    const currentUrl = await driver.getCurrentUrl();
    const title = await driver.getTitle();

    fs.writeFileSync(
      "screenshots/TC-01-homepage.png",
      await driver.takeScreenshot(),
      "base64"
    );

    if (!currentUrl.includes("localhost:8443")) {
      throw new Error("Homepage URL did not load correctly.");
    }

    console.log("Current URL:", currentUrl);
    console.log("Page title:", title);
  });
});