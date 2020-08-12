// parseHTML

const {load} = require('cheerio');
const pretty = require('pretty');

const minifyHTML = require('./minifyHTML');

const {info} = require('./logger');
const {
  isAbsoluteURL,
} = require('./index');


const parseHTML = (content, config) => {
  info(' > Parsing HTML: load content');
  const {ENV, revision} = config;

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
    const fpath = href + '?rev=' + revision;
    const subTag = `<link rel="preload" href="${fpath}" as="style">`;
    $('head').append(subTag);
    const styleTag = `<link rel="stylesheet" type="text/css" href="${fpath}">`;
    $('head').append(styleTag);
  });

  info(' > Parsing HTML: put JS back');
  jsLinks.forEach((href) => {
    const fpath = href + '?rev=' + revision;
    const subTag = `<link rel="preload" href="${fpath}" as="script">`;
    $('head').append(subTag);
    const scriptTag = `<script type="text/javascript" src="${fpath}"></script>`;
    $('body').append(scriptTag);
  });

  const html = $.html();
  const min = minifyHTML(html);
  if (ENV === 'production') {
    return min;
  }

  info(' > Parsing HTML: prettifying HTML code');
  const prettifiedHTML = pretty(min, {ocd: true});
  info(' > Parsing HTML: prettified HTML code');
  return prettifiedHTML;
};


module.exports = parseHTML;
