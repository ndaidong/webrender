// readFile

const {
  existsSync,
  readFileSync,
} = require('fs');

module.exports = (f) => {
  return existsSync(f) ? readFileSync(f, 'utf8') : '';
};
