const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");

describe("Vault Ventures Invalid Login Test", function () {
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

  it("TC-04 should not login with invalid credentials", async function () {
    await driver.get("http://localhost:8443/login");
    await driver.executeScript("localStorage.clear(); sessionStorage.clear();");

    await driver.wait(
      until.elementLocated(By.css("input[type='email'], input[name='email']")),
      15000
    );

    await driver
      .findElement(By.css("input[type='email'], input[name='email']"))
      .sendKeys("wrong@example.com");

    await driver
      .findElement(By.css("input[type='password'], input[name='password']"))
      .sendKeys("wrong-password-123");

    const submitButton = await driver.wait(
      until.elementLocated(By.css("#login-submit")),
      15000
    );

    await driver.executeScript("arguments[0].click();", submitButton);

    await driver.sleep(5000);

    const currentUrl = await driver.getCurrentUrl();

    fs.writeFileSync(
      "screenshots/TC-04-invalid-login.png",
      await driver.takeScreenshot(),
      "base64"
    );

    if (!currentUrl.includes("/login")) {
      throw new Error("Invalid login should stay on login page.");
    }

    const errorElements = await driver.findElements(
      By.css("#login-error, [role='alert']")
    );

    if (errorElements.length === 0) {
      const pageText = await driver.findElement(By.css("body")).getText();
      console.log("DEBUG currentUrl:", currentUrl);
      console.log("DEBUG pageText:", pageText.slice(0, 500));
      throw new Error("Invalid login error alert was not displayed.");
    }

    const errorText = await errorElements[0].getText();

    if (!errorText || errorText.trim().length < 3) {
      throw new Error("Invalid login error alert was empty.");
    }

    console.log("Invalid login stayed at:", currentUrl);
    console.log("Error message:", errorText);
  });
});