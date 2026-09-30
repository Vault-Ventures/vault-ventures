const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");

describe("Vault Ventures Login Page Test", function () {
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

  it("TC-02 should open login page successfully", async function () {
    await driver.get("http://localhost:8443/login");

    await driver.wait(until.elementLocated(By.css("body")), 15000);
    await driver.sleep(3000);

    const currentUrl = await driver.getCurrentUrl();
    const pageText = await driver.findElement(By.css("body")).getText();

    fs.writeFileSync(
      "screenshots/TC-02-login-page.png",
      await driver.takeScreenshot(),
      "base64"
    );

    if (!currentUrl.includes("/login")) {
      throw new Error("Login page URL did not load correctly.");
    }

    if (
      !pageText.toLowerCase().includes("login") &&
      !pageText.toLowerCase().includes("sign")
    ) {
      throw new Error("Login page content was not detected.");
    }

    console.log("Current URL:", currentUrl);
  });
});