// build

const {execSync} = require('child_process');
const {readdirSync, existsSync} = require('fs');

const nunjucks = require('nunjucks');
const {load} = require('cheerio');
const {genid} = require('bellajs');

const parseJS = require('./utils/parseJS');
const parseCSS = require('./utils/parseCSS');
const minifyHTML = require('./utils/minifyHTML');
const {info} = require('./utils/logger');

const {
  isFile,
  isHtmlFile,
  isAbsoluteURL,
  getBaseDir,
  getFileName,
  getAssetPath,
  makeFilePath,
  readFile,
  writeFile,
  fixPath,
} = require('./utils');

const buildHtmlPage = async (tplFile, config, targetDir) => {
  info(`Building page "${tplFile}...`);
  info(' > Parsing HTML: load content');
  const {NOTPL, SRCDIR, TPLDIR, revision} = config;
  const tplContent = readFile(tplFile);
  nunjucks.configure(TPLDIR);
  const content = NOTPL ? tplContent : nunjucks.renderString(tplContent, config);

  const $ = load(content, {
    normalizeWhitespace: true,
  });

  const cssFiles = [];
  const jsFiles = [];

  info(' > Parsing HTML: process CSS scripts');

  $('link[rel="stylesheet"]').each((k, el) => {
    const $el = $(el);
    const relFilePath = $el.attr('href') || '';
    if (relFilePath && !isAbsoluteURL(relFilePath)) {
      $el.remove();
      const srcFilePath = makeFilePath(SRCDIR, relFilePath);
      if (existsSync(srcFilePath)) {
        cssFiles.push(relFilePath);
        const fpath = relFilePath + '?rev=' + revision;
        const subTag = `<link rel="preload" href="${fpath}" as="style">`;
        $('head').append(subTag);
        const styleTag = `<link rel="stylesheet" type="text/css" href="${fpath}">`;
        $('head').append(styleTag);
      }
    }
  });

  cssFiles.forEach(async (cssFile) => {
    const srcFilePath = makeFilePath(SRCDIR, cssFile);
    const cssContent = await parseCSS(srcFilePath, 'production');
    const baseDir = getBaseDir(cssFile);
    const destDir = getAssetPath(baseDir, targetDir);
    execSync(`mkdir -p ${destDir}`);
    const fileName = getFileName(cssFile);
    const distFilePath = getAssetPath(fileName, destDir);
    writeFile(distFilePath, cssContent);
  });

  info(' > Parsing HTML: process JS scripts');

  $('script').each((k, el) => {
    const $el = $(el);
    const relFilePath = $el.attr('src') || '';
    if (relFilePath && !isAbsoluteURL(relFilePath)) {
      $el.remove();
      const srcFilePath = makeFilePath(SRCDIR, relFilePath);
      if (existsSync(srcFilePath)) {
        jsFiles.push(relFilePath);
        const fpath = relFilePath + '?rev=' + revision;
        const subTag = `<link rel="preload" href="${fpath}" as="script">`;
        $('head').append(subTag);
        const scriptTag = `<script type="text/javascript" src="${fpath}"></script>`;
        $('body').append(scriptTag);
      }
    }
  });

  jsFiles.forEach(async (jsFile) => {
    const srcFilePath = makeFilePath(SRCDIR, jsFile);
    const jsContent = await parseJS(srcFilePath, 'production');
    const entries = [jsContent];
    const baseDir = getBaseDir(jsFile);
    const destDir = getAssetPath(baseDir, targetDir);
    execSync(`mkdir -p ${destDir}`);
    const fileName = getFileName(jsFile);
    const distFilePath = getAssetPath(fileName, destDir);
    writeFile(distFilePath, entries.join('\n\n' + '/'.repeat(80) + '\n'));
  });

  info(' > Parsing HTML: cleanify & minify HTML code');
  const fileName = getFileName(tplFile);
  const htmlFilePath = makeFilePath(targetDir, fileName);

  const html = $.html();
  writeFile(htmlFilePath, minifyHTML(html));
  info(`Release a HTML page at '${htmlFilePath}'`);

  return true;
};

const build = (src, dist = './dist') => {
  const env = process.env || {};
  const TPLDIR = env.TPLDIR || './templates';
  const NOTPL = TPLDIR === 'false';

  const sourceDir = fixPath(src, __dirname);
  const confFile = makeFilePath(sourceDir, 'config.json');
  const config = existsSync(confFile) ? require(confFile) : {};
  const tplDir = makeFilePath(sourceDir, TPLDIR);

  config.ENV = env.ENV || 'dev';
  config.NOTPL = NOTPL;
  config.TPLDIR = tplDir;
  config.SRCDIR = sourceDir;
  config.revision = genid(32);

  if (existsSync(dist)) {
    execSync(`rm -rf ${dist}`);
    info(`Remove old "${dist}" folder `);
  }
  execSync(`mkdir -p ${dist}`);
  info(`Create "${dist}" folder `);

  const sourceStaticDir = makeFilePath(sourceDir, './static');
  if (existsSync(sourceStaticDir)) {
    execSync(`cp -r ${sourceStaticDir}/* ${dist}`);
    info(`Release "${sourceStaticDir}"`);
  }

  const compile = (file) => {
    const f = makeFilePath(tplDir, file);
    if (isFile(f) && isHtmlFile(f)) {
      return buildHtmlPage(f, config, dist);
    }
  };
  readdirSync(tplDir).map(compile);
};

module.exports = build;
