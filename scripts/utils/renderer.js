// renderer

const nunjucks = require('nunjucks');

const {error} = require('./logger');

const parseCSS = require('./parseCSS');
const parseJS = require('./parseJS');
const parseHTML = require('./parseHTML');

const {readFile} = require('./index');
const {info} = require('./logger');

const cache = new Map();

const renderCSS = async (cssFile, config = {}) => {
  const {ENV} = config;
  if (ENV === 'production' && cache.has(cssFile)) {
    info('Load CSS from cache');
    return cache.get(cssFile);
  }
  const css = await parseCSS(cssFile, ENV);
  if (ENV === 'production') {
    info('Save CSS to cache');
    cache.set(cssFile, css);
  }
  return css;
};

const renderJS = async (jsFile, config = {}) => {
  const {ENV} = config;
  if (ENV === 'production' && cache.has(jsFile)) {
    info('Load JS from cache');
    return cache.get(jsFile);
  }
  const js = await parseJS(jsFile, ENV);
  if (ENV === 'production') {
    info('Save JS to cache');
    cache.set(jsFile, js);
  }
  return js;
};

const renderHTML = async (tplFile, config = {}) => {
  try {
    const {NOTPL, TPLDIR} = config;
    const tplContent = readFile(tplFile);
    nunjucks.configure(TPLDIR);
    const content = NOTPL ? tplContent : nunjucks.renderString(tplContent, config);
    const html = await parseHTML(content, config);
    return html;
  } catch (err) {
    error(`Error while rending template "${tplFile}"`);
    error(String(err));
    console.trace(err);
    return '';
  }
};

module.exports = {
  renderHTML,
  renderCSS,
  renderJS,
};
