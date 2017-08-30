const config = require('./../config.json');

module.exports = (url, configValue) => {
  if (!url && configValue) {
    return `${config.url}${config[configValue]}`;
  } else {
    return `${config.url}${url}`;
  }
};
