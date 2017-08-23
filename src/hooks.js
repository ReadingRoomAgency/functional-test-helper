const { defineSupportCode } = require('cucumber');
const { writeFile } = require('fs');
const { join } = require('path');
const timemachine = require('timemachine');

const configPath = join(__dirname, '../../docker/mockServer/src/funcTestConfig.json');

function resetConfig(callback) {
  const json = { errors: [], timeouts: [] };

  writeFile(configPath, JSON.stringify(json, null, 2), 'utf8', (writeErr) => {
    if (writeErr) {
      throw writeErr;
    }

    callback();
  });
}

defineSupportCode(({ After, Before, registerHandler }) => {
  Before((scenario, callback) => {
    resetConfig(callback);
  });

  Before({tags: "@mockServer"}, function () {
    timemachine.config({
      dateString: 'July 4, 2017 12:00:00'
    });
  });

  After(function after() {
    this.driver.navigate().refresh();
  });

  registerHandler('AfterFeatures', (features, callback) => {
    resetConfig(callback);
  });
});
