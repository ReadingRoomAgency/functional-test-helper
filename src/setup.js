const { defineSupportCode } = require('cucumber');
const { startDriver, getDriver, quitDriver } = require('./getDriver');
const config = require('./config.json');

let currentSize;

const browserSizes = {
  mobile: {
    width: 375,
    height: 667,
  },
  tablet: {
    width: 768,
    height: 1024,
  },
  desktop: {
    width: 1200,
    height: 900,
  },
};

function scenarioHasTag(scenario, matchTag) {
  let hasTag = false;

  scenario.scenario.tags.forEach((tag) => {
    if (tag.name === matchTag) {
      hasTag = true;
    }
  });

  return hasTag;
}

function isTestingOnDevice() {
  if (!config.browserstackCapabilities) {
    return false;
  }

  if (config.browserstackCapabilities.os === 'ios') {
    return true;
  }

  if (config.browserstackCapabilities.os === 'android') {
    return true;
  }

  return false;
}

function before(scenario, callback) {
  // Reset application Started
  // Reset dummy database if needed?
  this.driver = getDriver();

  if (!isTestingOnDevice()) {
    let size = currentSize;

    if (scenarioHasTag(scenario, '@mobile')) {
      size = browserSizes.mobile;
    } else if (scenarioHasTag(scenario, '@tablet')) {
      size = browserSizes.tablet;
    } else {
      size = browserSizes.desktop;
    }

    if (size !== currentSize) {
      this.driver.manage().window().setSize(size.width, size.height);
      currentSize = size;
    }
  }

  callback();
}

defineSupportCode(({ registerHandler, setDefaultTimeout, Before }) => {
  registerHandler('BeforeFeatures', (features, callback) => {
    startDriver(callback);
  });

  registerHandler('AfterFeatures', (features, callback) => {
    quitDriver(callback);
  });

  setDefaultTimeout(10000);
  Before(before);
});
