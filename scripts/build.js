// build

const {execSync} = require('child_process');
const {readdirSync, existsSync} = require('fs');

const {genid} = require('bellajs');
const {load} = require('cheerio');

const parseJS = require('./parseJS');
const parseCSS = require('./parseCSS');
const minifyHTML = require('./minifyHTML');
const {info, error} = require('./logger');

const {
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
} = require('./utils');


const REVISION = genid(24);

const buildHtmlPage = (tplFile, sourceDir, targetDir) => {
  info(`Building page "${tplFile}...`);
  const tplFilePath = createFilePath(sourceDir, tplFile);

  info(' > Parsing HTML: load content');
  const htmlContent = readFile(tplFilePath);
  const $ = load(htmlContent, {
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
      const srcFilePath = getAssetPath(relFilePath, sourceDir);
      if (existsSync(srcFilePath)) {
        cssFiles.push(relFilePath);
        const fpath = relFilePath + '?rev=' + REVISION;
        const subTag = `<link rel="subresource" href="${fpath}">`;
        $('head').append(subTag);
        const styleTag = `<link rel="stylesheet" type="text/css" href="${fpath}">`;
        $('head').append(styleTag);
      }
    }
  });

  cssFiles.forEach(async (cssFile) => {
    const srcFilePath = getAssetPath(cssFile, sourceDir);
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
      const srcFilePath = getAssetPath(relFilePath, sourceDir);
      if (existsSync(srcFilePath)) {
        jsFiles.push(relFilePath);
        const fpath = relFilePath + '?rev=' + REVISION;
        const scriptTag = `<script type="text/javascript" src="${fpath}"></script>`;
        $('body').append(scriptTag);
      }
    }
  });

  jsFiles.forEach(async (jsFile) => {
    const srcFilePath = getAssetPath(jsFile, sourceDir);
    const jsContent = await parseJS(srcFilePath, 'production');
    const baseDir = getBaseDir(jsFile);
    const destDir = getAssetPath(baseDir, targetDir);
    execSync(`mkdir -p ${destDir}`);
    const fileName = getFileName(jsFile);
    const distFilePath = getAssetPath(fileName, destDir);
    writeFile(distFilePath, jsContent);
  });

  info(' > Parsing HTML: cleanify & minify HTML code');
  const htmlFilePath = createFilePath(targetDir, tplFile);

  const html = $.html();
  writeFile(htmlFilePath, minifyHTML(html));
  info(`Release a HTML page at '${htmlFilePath}'`);
};


const build = (src, dist = './dist') => {
  if (!existsSync(src)) {
    return error(`"${src}" does not exist!`);
  }
  if (!isDirectory(src)) {
    return error(`"${src}" is not a directory!`);
  }
  if (!existsSync(dist)) {
    execSync(`mkdir -p ${dist}`);
  }
  const webfolder = getFileName(src);
  const targetDir = createFilePath(dist, webfolder);
  if (existsSync(targetDir)) {
    execSync(`rm -rf ${targetDir}`);
  }
  execSync(`mkdir -p ${targetDir}`);
  const faviconFile = createFilePath(src, 'favicon.ico');
  if (existsSync(faviconFile)) {
    execSync(`cp ${faviconFile} ${targetDir}`);
  }
  const sourceStaticDir = createFilePath(src, 'static');
  if (existsSync(sourceStaticDir)) {
    execSync(`cp -r ${sourceStaticDir} ${targetDir}`);
  }

  readdirSync(src).forEach((file) => {
    const f = createFilePath(src, file);
    if (isFile(f) && isHtmlFile(f)) {
      return buildHtmlPage(file, src, targetDir);
    }
  });
};

module.exports = build;
