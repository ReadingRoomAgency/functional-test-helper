const getPage = require('../getPage');

module.exports = (driver, url, configValue) =>
  driver
    .get(getPage(url, configValue));
