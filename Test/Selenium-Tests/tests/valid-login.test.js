const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");

describe("Vault Ventures Valid Login Test", function () {
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

  it("TC-03 should login successfully with valid credentials", async function () {
    const email = process.env.VV_EMAIL;
    const password = process.env.VV_PASSWORD;

    if (!email || !password) {
      throw new Error("Login credentials are missing from environment variables.");
    }

    await driver.get("http://localhost:8443/login");
    await driver.executeScript("localStorage.clear(); sessionStorage.clear();");

    await driver.wait(
      until.elementLocated(By.css("input[type='email'], input[name='email']")),
      15000
    );

    await driver
      .findElement(By.css("input[type='email'], input[name='email']"))
      .sendKeys(email);

    await driver
      .findElement(By.css("input[type='password'], input[name='password']"))
      .sendKeys(password);

    fs.writeFileSync(
      "screenshots/TC-03-before-login-submit.png",
      await driver.takeScreenshot(),
      "base64"
    );

    const submitButton = await driver.wait(
      until.elementLocated(By.css("#login-submit")),
      15000
    );

    await driver.executeScript("arguments[0].click();", submitButton);

    await driver.wait(async function () {
      const url = await driver.getCurrentUrl();
      return !url.includes("/login");
    }, 20000);

    const currentUrl = await driver.getCurrentUrl();
    const pageText = await driver.findElement(By.css("body")).getText();

    fs.writeFileSync(
      "screenshots/TC-03-after-login.png",
      await driver.takeScreenshot(),
      "base64"
    );

    console.log("DEBUG currentUrl:", currentUrl);
    console.log("DEBUG pageText:", pageText.slice(0, 500));

    if (currentUrl.includes("/login")) {
      throw new Error("Login did not redirect away from login page.");
    }

    if (!currentUrl.includes("/app/") || !currentUrl.includes("dashboard")) {
      throw new Error("Login did not redirect to an app dashboard.");
    }

    console.log("Login redirected to:", currentUrl);
  });
});