// parseHTML

const {normalize} = require('path');

const {load} = require('cheerio');
const pretty = require('pretty');

const {info} = require('./logger');
const {
  isAbsoluteURL,
  readFile,
} = require('./utils');


const parseHTML = (content, rev) => {
  info(' > Parsing HTML: load content');
  const $ = load(content, {
    normalizeWhitespace: true,
  });

  info(' > Parsing HTML: process CSS scripts');
  const cssLinks = [];
  $('link[rel="stylesheet"]').each((k, el) => {
    const $el = $(el);
    const href = $el.attr('href') || '';
    if (href && !isAbsoluteURL(href)) {
      cssLinks.push(href);
      $el.remove();
    }
  });

  info(' > Parsing HTML: process JS scripts');
  const jsLinks = [];
  $('script').each((k, el) => {
    const $el = $(el);
    const href = $el.attr('src') || '';
    if (href && !isAbsoluteURL(href)) {
      jsLinks.push(href);
      $el.remove();
    }
  });

  info(' > Parsing HTML: put CSS back');
  cssLinks.forEach((href) => {
    const fpath = href + '?v=' + rev;
    const subTag = `<link rel="subresource" href="${fpath}">`;
    $('head').append(subTag);
    const styleTag = `<link rel="stylesheet" type="text/css" href="${fpath}">`;
    $('head').append(styleTag);
  });

  info(' > Parsing HTML: put JS back');
  jsLinks.forEach((href) => {
    const fpath = href + '?v=' + rev;
    const scriptTag = `<script type="text/javascript" src="${fpath}"></script>`;
    $('body').append(scriptTag);
  });

  const html = $.html();

  info(' > Parsing HTML: prettifying HTML code');
  const prettifiedHTML = pretty(html, {ocd: true});
  info(' > Parsing HTML: prettified HTML code');
  return prettifiedHTML;
};


module.exports = (filePath, rev) => {
  const fullPath = normalize(filePath);
  info('Start parsing HTML content...');
  const content = readFile(fullPath);
  const htmlContent = parseHTML(content, rev);
  info(`Finish parsing HTML file '${fullPath}'`);
  return htmlContent;
};
