// utils

const {extname, normalize, join, parse} = require('path');
const URL = require('url');
const {
  statSync,
  existsSync,
  readFileSync,
  writeFileSync,
} = require('fs');

const isFile = (f) => {
  const stats = statSync(f);
  return !stats.isDirectory();
};

const isDirectory = (f) => {
  const stats = statSync(f);
  return stats.isDirectory();
};

const isHtmlFile = (f) => {
  return ['.html', '.htm'].includes(extname(f));
};

const isAbsoluteURL = (file = '') => {
  const f = String(file);
  return f.startsWith('http') || f.startsWith('//');
};

const createFilePath = (...args) => {
  return normalize(join(...args));
};

const getAssetPath = (relPath, sourceDir) => {
  const pathname = URL.parse(relPath).pathname || '';
  return pathname ? createFilePath(sourceDir, pathname) : sourceDir;
};

const getBaseDir = (relPath) => {
  return parse(relPath).dir || '';
};

const getFileName = (relPath) => {
  return parse(relPath).base;
};

const readFile = (f) => {
  return existsSync(f) ? readFileSync(f, 'utf8') : '';
};

const writeFile = (f, content) => {
  return writeFileSync(f, content, 'utf8');
};

module.exports = {
  isFile,
  isDirectory,
  isHtmlFile,
  isAbsoluteURL,
  createFilePath,
  getAssetPath,
  getBaseDir,
  getFileName,
  readFile,
  writeFile,
};
