// get dependent package.json 
const packageJson = require(`${process.cwd()}\\package.json`) // eslint-disable-line

console.error('@ INSIDE INDEX', process.cwd());
console.error('@ DIRNAME', __dirname);
console.error('@ JSON', packageJson.ftHelper);

if (packageJson && packageJson.ftHelper) {
  
} else {
  console.error(
  `functional-test-helper 
  needs a "ftHelper" configuration 
  property in your package json`);
  process.exit(1);
}