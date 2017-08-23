const webdriver = require('selenium-webdriver');

module.exports = (driver, selector) =>
    driver
      .findElement(webdriver.By.css(selector))
      .click();
