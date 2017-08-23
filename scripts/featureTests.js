#!/usr/bin/env node

/* eslint max-lines: 0 */

const inquirer = require('inquirer');
const { writeFileSync, existsSync, readFileSync } = require('fs');
const BrowserStack = require('browserstack');
const path = require('path');
const { spawn } = require('child_process');
const { find } = require('find-in-files');
const readline = require('readline');
require('dotenv').config(path.join(__dirname, '../.env'));

const configFile = path.join(__dirname, '../features/support/config.json');
const config = {};

function getCucumberArgs(callback) {
  const file = readFileSync(configFile, 'utf8');
  const configJson = JSON.parse(file);
  let { tags } = configJson;
  if (!tags) {
    tags = [];
  }
  const command = ['run', 'cucumber:bin', '--'];

  tags.forEach((tag) => {
    command.push('--tags', `@${tag}`);
  });

  const includeMocks = (process.argv.indexOf('--mockServer') > -1)
    ? []
    : ['--tags', 'not @mockServer'];
  const excludeFF = getBrowserName(configJson) === 'firefox'
    ? ['--tags', 'not @notFF']
    : [];
  const excludeIE = getBrowserName(configJson) === 'ie'
    ? ['--tags', 'not @notIE']
    : [];

  find('@debug', path.join(__dirname, '../features'), '.feature$')
    .then((results) => {
      const onlyDebug = [];
      if (Object.keys(results).length !== 0) {
        onlyDebug.push('--tags', '@debug');
      }
      callback(command.concat(includeMocks, onlyDebug, excludeFF, excludeIE));
    });
}

function runCucumber() {
  getCucumberArgs((args) => {
    let command = 'npm';

    if (/^win/.test(process.platform)) {
      command += '.cmd';
    }

    const cucumberProcess = spawn(command, args, { cwd: path.join(__dirname, '../') });

    readline.createInterface({ input: cucumberProcess.stdout, terminal: false })
      .on('line', (line) => {
        // eslint-disable-next-line
        console.log(line);
      });

    readline.createInterface({ input: cucumberProcess.stderr, terminal: false })
      .on('line', (line) => {
        // eslint-disable-next-line
        console.log(line);
      });

    cucumberProcess.on('error', (err) => {
      throw err;
    });
  });
}

function setConfig() {
  writeFileSync(configFile, JSON.stringify(config, null, 2));
  runCucumber();
}

function getBrowserName(config) {
  if(config.local) {
    return config.localBrowser;
  }
  return config.browserstackCapabilities.browserName;
}

function runLocally() {
  const questions = [{
    type: 'list',
    name: 'browser',
    message: 'Choose a local browser to test on',
    choices: ['chrome', 'phantomjs', 'internet explorer', 'firefox'],
  }];

  inquirer.prompt(questions, (answers) => {
    config.localBrowser = answers.browser;
    setConfig();
  });
}

function alphabeticalSort(a, b) {
  const osx = [
    'Sierra',
    'El Capitan',
    'Yosemite',
    'Mavericks',
    'Mountain Lion',
    'Lion',
    'Snow Leopard',
  ];

  if (osx.includes(a) && !osx.includes(b)) {
    return -1;
  }

  if (!osx.includes(a) && osx.includes(b)) {
    return 1;
  }

  if (osx.includes(a) && osx.includes(b)) {
    return osx.indexOf(a) - osx.indexOf(b);
  }

  return a.toLowerCase().localeCompare(b.toLowerCase());
}

function sortNumber(a, b) {
  return a - b;
}

function pickABrowserVersion(versions) {
  if (versions.length === 1) {
    const version = versions[0];
    config.browserstackCapabilities.browser_version = version;
    setConfig();
    return;
  }

  const questions = [{
    type: 'list',
    name: 'version',
    message: 'Choose a browser version',
    choices: versions.sort(sortNumber).reverse(),
  }];

  inquirer.prompt(questions, (answers) => {
    config.browserstackCapabilities.browser_version = answers.version;
    setConfig();
  });
}

function pickABrowser(browsers) {
  if (Object.keys(browsers).length === 1) {
    const browser = Object.keys(browsers)[0];
    config.browserstackCapabilities.browserName = browser;
    pickABrowserVersion(browsers[browser]);
    return;
  }

  const questions = [{
    type: 'list',
    name: 'browser',
    message: 'Choose a browser',
    choices: Object.keys(browsers).sort(alphabeticalSort),
  }];

  inquirer.prompt(questions, (answers) => {
    config.browserstackCapabilities.browserName = answers.browser;
    pickABrowserVersion(browsers[answers.browser]);
  });
}

function pickAPlatformVersion(versions) {
  if (Object.keys(versions).length === 1) {
    const version = Object.keys(versions)[0];
    config.browserstackCapabilities.os_version = version;
    pickABrowser(versions[version]);
    return;
  }

  const questions = [{
    type: 'list',
    name: 'version',
    message: 'Choose a platform version',
    choices: Object.keys(versions).sort(alphabeticalSort),
  }];

  inquirer.prompt(questions, (answers) => {
    config.browserstackCapabilities.os_version = answers.version;
    pickABrowser(versions[answers.version]);
  });
}

function pickADeviceBrowser(browsers) {
  if (browsers.length === 1) {
    const browser = browsers[0];
    config.browserstackCapabilities.browserName = browser;
    setConfig();
    return;
  }

  const questions = [{
    type: 'list',
    name: 'browser',
    message: 'Choose a browser',
    choices: browsers.sort(alphabeticalSort),
  }];

  inquirer.prompt(questions, (answers) => {
    config.browserstackCapabilities.browserName = answers.browser;
    setConfig();
  });
}

function pickADeviceVersion(versions) {
  if (Object.keys(versions).length === 1) {
    const version = Object.keys(versions)[0];
    config.browserstackCapabilities.os_version = version;
    pickADeviceBrowser(versions[version]);
    return;
  }

  const questions = [{
    type: 'list',
    name: 'version',
    message: 'Choose a device version',
    choices: Object.keys(versions).sort(alphabeticalSort),
  }];

  inquirer.prompt(questions, (answers) => {
    config.browserstackCapabilities.os_version = answers.version;
    pickADeviceBrowser(versions[answers.version]);
  });
}

function pickADevice(devices) {
  if (Object.keys(devices).length === 1) {
    const device = Object.keys(devices)[0];
    config.browserstackCapabilities.device = device;
    pickADeviceVersion(devices[device]);
    return;
  }

  const questions = [{
    type: 'list',
    name: 'device',
    message: 'Choose a device',
    choices: Object.keys(devices).sort(alphabeticalSort).reverse(),
  }];

  inquirer.prompt(questions, (answers) => {
    config.browserstackCapabilities.device = answers.device;
    pickADeviceVersion(devices[answers.device]);
  });
}

function getBrowsers(browsers) {
  const browserObject = {};

  browsers.forEach(({ os, os_version, browser, browser_version, device }) => {
    if (!browserObject[os]) {
      browserObject[os] = {};
    }

    if (device) {
      if (!browserObject[os].device) {
        browserObject[os].device = {};
      }

      if (!browserObject[os].device[device]) {
        browserObject[os].device[device] = {};
      }

      if (!browserObject[os].device[device][os_version]) {
        browserObject[os].device[device][os_version] = [];
      }

      // eslint-disable-next-line
      if (browserObject[os].device[device][os_version].indexOf(browser) === -1) {
        browserObject[os].device[device][os_version].push(browser);
      }
    } else {
      if (!browserObject[os].noDevice) {
        browserObject[os].noDevice = {};
      }

      if (!browserObject[os].noDevice[os_version]) {
        browserObject[os].noDevice[os_version] = {};
      }

      if (!browserObject[os].noDevice[os_version][browser]) {
        browserObject[os].noDevice[os_version][browser] = [];
      }

      // eslint-disable-next-line
      if (browserObject[os].noDevice[os_version][browser].indexOf(browser_version) === -1) {
        browserObject[os].noDevice[os_version][browser].push(browser_version);
      }
    }
  });

  return browserObject;
}

function pickAPlatform(browsers) {
  // writeFileSync(configFile, JSON.stringify(browsers, null, 2));
  const questions = [{
    type: 'list',
    name: 'platform',
    message: 'Choose a platform to test on',
    choices: Object.keys(browsers).sort(alphabeticalSort),
  }];

  inquirer.prompt(questions, (answers) => {
    config.browserstackCapabilities.os = answers.platform;
    if (browsers[answers.platform].device) {
      pickADevice(browsers[answers.platform].device);
    } else {
      pickAPlatformVersion(browsers[answers.platform].noDevice);
    }
  });
}

function runOnBrowserstack() {
  const browserstackClient = BrowserStack.createAutomateClient({
    username: 'enttest1',
    password: 'rP33grYhdQQxyPR7NPu2',
  });

  browserstackClient.getBrowsers((error, browsers) => {
    // writeFileSync(configFile, JSON.stringify(browsers, null, 2));
    pickAPlatform(getBrowsers(browsers));
  });
}

function chooseServer(environment) {
  const questions = [{
    type: 'list',
    name: 'server',
    message: 'Do you want to test locally or on Browserstack?',
    choices: ['Locally', 'Browserstack'],
  }];

  inquirer.prompt(questions, (answers) => {
    if (answers.server === 'Locally') {
      config.local = true;
      runLocally();
    } else {
      config.local = false;
      config.browserstackCapabilities = {
        'browserstack.user': process.env.BROWSERSTACK_USER,
        'browserstack.key': process.env.BROWSERSTACK_KEY,
        project: process.env.BROWSERSTACK_PROJECT,
        build: process.env.BROWSERSTACK_BUILD,
      };

      if (environment !== 'Live') {
        config.browserstackCapabilities['browserstack.local'] = true;
      }

      runOnBrowserstack();
    }
  });
}

function chooseEnvironment() {
  const questions = [{
    type: 'list',
    name: 'env',
    message: 'Which environment do you want to test?',
    choices: ['Local', 'Dev', 'UAT', 'Live'],
  }];

  inquirer.prompt(questions, (answers) => {
    switch (answers.env) {
      case 'Local':
        config.url = process.env.WP_HOME;
        break;
      case 'Dev':
        config.url = process.env.DEV_URL;
        break;
      case 'UAT':
        config.url = process.env.UAT_URL;
        break;
      case 'Live':
        config.url = process.env.LIVE_URL;
        break;
      default:
        throw new Error('NO VALID ENVIRONMENT SELECTED');
    }

    chooseServer(answers.env);
  });
}

function useLastSettings() {
  if (existsSync(configFile)) {
    if (!process.argv.includes('--skip-check')) {
      const questions = [{
        type: 'list',
        name: 'confirm',
        message: 'Do you want to use the last settings?',
        choices: ['Yes', 'No'],
      }];

      return inquirer.prompt(questions, (answers) => {
        if (answers.confirm === 'No') {
          return chooseEnvironment();
        }

        return runCucumber();
      });
    }

    return runCucumber();
  }

  return chooseEnvironment();
}

useLastSettings();
