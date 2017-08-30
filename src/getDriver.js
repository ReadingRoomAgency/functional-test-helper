require('chromedriver');
require('phantomjs-prebuilt');
require('iedriver');
require('geckodriver');
const fs = require('fs');
const webdriver = require('selenium-webdriver');
const browserstack = require('browserstack-local');
var chrome = require("selenium-webdriver/chrome");
const config = require('./../config.json');

let driver;
let bsLocal;

function registerSaveScreenshot(callback) {
  webdriver.WebDriver.prototype.saveScreenshot = filename =>
    driver.takeScreenshot().then((data) => {
      fs.writeFile(filename, data.replace(/^data:image\/png;base64,/, ''), 'base64', (err) => {
        if (err) {
          throw err;
        }
      });
    });

  callback();
}

exports.startDriver = (callback) => {

  var options = new chrome.Options();
  // options.setBinary("/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary");
  options.addArguments("[--headless]");

  console.error('@ CHROME OPTIONS', options.toCapabilities());
  // which turns out to be “/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary”, and boom it worked!

  if (config.local) {
    driver = new webdriver.Builder()
      .forBrowser(config.localBrowser)
      .withCapabilities(options.toCapabilities())
      .build();

    // TODO: setting the device size to desktop for now but should be refactored
    driver.manage().window().setSize(1400, 1000);

    registerSaveScreenshot(callback);
  } else {
    bsLocal = new browserstack.Local();
    const bsLocalArgs = { key: config.browserstackCapabilities['browserstack.key'] };

    bsLocal.start(bsLocalArgs, () => {
      driver = new webdriver.Builder()
        .usingServer('http://hub-cloud.browserstack.com/wd/hub')
        .withCapabilities(config.browserstackCapabilities)
        .build();

      registerSaveScreenshot(callback);
    });
  }
};

exports.getDriver = () => driver;

exports.quitDriver = (callback) => {
  if (config.local) {
    driver.quit().then(() => {
      callback();
    });
  } else {
    bsLocal.stop(() => {
      driver.quit().then(() => {
        callback();
      });
    });
  }
};
